import { supabase } from '@/integrations/supabase/client';
import {
  addSyncEvent,
  cleanupExpiredOfflineData,
  cleanupSyncedOfflineData,
  getMediaBatch,
  getMutationByClientMutationId,
  getMutationByEntity,
  getPendingMutations,
  markMediaFailed,
  markMediaUploaded,
  markMediaUploading,
  markMutationFailed,
  markMutationSynced,
  markMutationSyncing,
  upsertRouteStopLocalState,
} from './store';
import type { OfflineMutation } from './types';
import type { OfflineMedia } from './types';

export interface OfflineSyncResult {
  synced: number;
  failed: number;
  skipped: number;
}

type ProofPayload = {
  clientProofId?: string;
  remotePayload?: Record<string, unknown>;
};

type StopPayload = {
  stopId?: string;
  routeId?: string;
  patch?: Record<string, unknown>;
  input?: {
    clientProofId?: string;
    clientStopCompletionId?: string;
    status?: string;
    completedAt?: string | null;
    collectedOilKg?: number | null;
    containersPicked?: Array<Record<string, unknown>>;
    containersDropped?: Array<Record<string, unknown>>;
    productsDelivered?: Array<Record<string, unknown>>;
  };
};

const isSupportedMutation = (mutation: OfflineMutation) =>
  mutation.provider === 'supabase' &&
  (
    mutation.workflowType === 'proofOfCollection' ||
    mutation.workflowType === 'stopStatusUpdate' ||
    mutation.workflowType === 'expense' ||
    mutation.workflowType === 'odometerPhoto' ||
    mutation.workflowType === 'damageReport' ||
    mutation.workflowType === 'backupRequest' ||
    mutation.workflowType === 'deliverySignature'
  );

const isProofMutation = (mutation: OfflineMutation) =>
  mutation.workflowType === 'proofOfCollection' || mutation.entityType === 'proofOfCollection';

const isStopMutation = (mutation: OfflineMutation) =>
  mutation.workflowType === 'stopStatusUpdate' || mutation.entityType === 'driverRouteStop';

const isGenericSupabaseMutation = (mutation: OfflineMutation) =>
  mutation.workflowType === 'expense' ||
  mutation.workflowType === 'odometerPhoto' ||
  mutation.workflowType === 'damageReport' ||
  mutation.workflowType === 'backupRequest' ||
  mutation.workflowType === 'deliverySignature';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error ?? 'Unknown sync error');

const extensionFromMedia = (media: OfflineMedia) => {
  if (media.format) return media.format.replace(/^\./, '').replace('jpeg', 'jpg');
  if (media.mimeType?.includes('/')) return media.mimeType.split('/')[1].replace('jpeg', 'jpg');
  return media.kind === 'signature' ? 'png' : 'jpg';
};

async function blobFromMedia(media: OfflineMedia): Promise<Blob> {
  if (media.blob) return media.blob;

  const source = media.localUri ?? media.webPath ?? media.localPath;
  if (!source) {
    throw new Error(`Queued media ${media.clientMediaId} has no local data.`);
  }

  const response = await fetch(source);
  return response.blob();
}

async function uploadMedia(media: OfflineMedia): Promise<OfflineMedia> {
  if (media.uploadStatus === 'uploaded' && media.remotePath) return media;

  await markMediaUploading(media.id);
  try {
    const blob = await blobFromMedia(media);
    const ext = extensionFromMedia(media);
    const path = `${media.userId}/poc/${Date.now()}-${media.clientMediaId}.${ext}`;
    const { error } = await supabase.storage.from('compliance-media').upload(path, blob, {
      contentType: media.mimeType || blob.type || 'image/jpeg',
      upsert: false,
    });

    if (error) throw error;

    return await markMediaUploaded(media.id, path) ?? { ...media, remotePath: path, uploadStatus: 'uploaded' };
  } catch (error) {
    await markMediaFailed(media.id, getErrorMessage(error));
    throw error;
  }
}

async function applyUploadedMediaToProofPayload(
  mutation: OfflineMutation,
  remotePayload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!mutation.mediaIds.length) return remotePayload;

  const mediaItems = await getMediaBatch(mutation.mediaIds);
  if (mediaItems.length !== mutation.mediaIds.length) {
    throw new Error('Queued proof is missing one or more media records.');
  }

  const uploaded = await Promise.all(mediaItems.map((media) => uploadMedia(media)));
  const signature = uploaded.find((media) => media.kind === 'signature' && media.remotePath);
  const photos = uploaded
    .filter((media) => media.kind === 'photo' && media.remotePath)
    .map((media) => media.remotePath as string);

  const existingPhotos = Array.isArray(remotePayload.photo_urls)
    ? remotePayload.photo_urls.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    ...remotePayload,
    signature_data: signature?.remotePath ?? remotePayload.signature_data ?? null,
    photo_urls: [...existingPhotos, ...photos],
  };
}

type MediaBinding = {
  mediaId: string;
  targetField: string;
  mode?: 'replace' | 'appendArray';
};

type GenericSupabasePayload = {
  table?: string;
  op?: 'insert' | 'update' | 'upsert';
  remotePayload?: Record<string, unknown>;
  match?: Record<string, unknown>;
  mediaBindings?: MediaBinding[];
  mediaOnly?: boolean;
  metadata?: Record<string, unknown>;
};

async function applyMediaBindings(
  remotePayload: Record<string, unknown>,
  mediaBindings: MediaBinding[] = [],
): Promise<Record<string, unknown>> {
  if (!mediaBindings.length) return remotePayload;

  const mediaItems = await getMediaBatch(mediaBindings.map((binding) => binding.mediaId));
  const byId = new Map(mediaItems.flatMap((media) => [[media.id, media], [media.clientMediaId, media]]));
  const next = { ...remotePayload };

  for (const binding of mediaBindings) {
    const media = byId.get(binding.mediaId);
    if (!media) throw new Error(`Queued media ${binding.mediaId} is missing.`);
    const uploaded = await uploadMedia(media);
    if (!uploaded.remotePath) throw new Error(`Queued media ${binding.mediaId} did not upload.`);

    if (binding.mode === 'appendArray') {
      const existing = Array.isArray(next[binding.targetField]) ? next[binding.targetField] as unknown[] : [];
      next[binding.targetField] = [...existing, uploaded.remotePath];
    } else {
      next[binding.targetField] = uploaded.remotePath;
    }
  }

  return next;
}

async function syncGenericSupabaseMutation(mutation: OfflineMutation): Promise<void> {
  const payload = mutation.payload as GenericSupabasePayload;
  if (payload.mediaOnly) {
    const mediaItems = await getMediaBatch(mutation.mediaIds);
    if (mediaItems.length !== mutation.mediaIds.length) {
      throw new Error('Queued media-only upload is missing one or more media records.');
    }

    const uploaded = await Promise.all(mediaItems.map((media) => uploadMedia(media)));
    const remotePaths = uploaded
      .map((media) => media.remotePath)
      .filter((path): path is string => typeof path === 'string' && path.length > 0);

    await markMutationSynced(mutation.id, {
      remoteEntityId: mutation.entityId,
      remoteResult: { remotePaths, metadata: payload.metadata ?? {} },
    });

    await addSyncEvent({
      level: 'info',
      message: 'Queued media uploaded.',
      mutationId: mutation.id,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
      details: { remotePaths, metadata: payload.metadata ?? {} },
    });
    return;
  }

  if (!payload.table || !payload.remotePayload) {
    throw new Error('Queued Supabase mutation is missing table or remotePayload.');
  }

  const remotePayload = await applyMediaBindings(payload.remotePayload, payload.mediaBindings);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = supabase.from(payload.table as any);
  let result;

  if (payload.op === 'update') {
    let query = table.update(remotePayload as never);
    Object.entries(payload.match ?? {}).forEach(([key, value]) => {
      query = query.eq(key, value as never);
    });
    result = await query.select('id').maybeSingle();
  } else if (payload.op === 'upsert') {
    result = await table.upsert(remotePayload as never).select('id').maybeSingle();
  } else {
    result = await table.insert(remotePayload as never).select('id').maybeSingle();
  }

  if (result.error) throw result.error;
  const remoteId = (result.data as { id?: string } | null)?.id ?? mutation.entityId;

  await markMutationSynced(mutation.id, {
    remoteEntityId: remoteId,
    remoteResult: { table: payload.table, id: remoteId ?? null },
  });

  await addSyncEvent({
    level: 'info',
    message: `${payload.table} synced.`,
    mutationId: mutation.id,
    entityType: mutation.entityType,
    entityId: remoteId,
  });
}

async function syncProofMutation(mutation: OfflineMutation): Promise<string> {
  const payload = mutation.payload as ProofPayload;
  let remotePayload = payload.remotePayload;

  if (!remotePayload) {
    throw new Error('Queued proof is missing remotePayload.');
  }

  remotePayload = await applyUploadedMediaToProofPayload(mutation, remotePayload);

  const { data, error } = await supabase
    .from('proof_of_collection')
    .insert(remotePayload as never)
    .select('id')
    .single();

  if (error) throw error;

  const proofId = (data as { id?: string } | null)?.id;
  if (!proofId) {
    throw new Error('Proof sync did not return a proof_of_collection id.');
  }

  await markMutationSynced(mutation.id, {
    remoteEntityId: proofId,
    remoteResult: { proofOfCollectionId: proofId, clientProofId: payload.clientProofId ?? mutation.entityId },
  });

  await addSyncEvent({
    level: 'info',
    message: 'Proof of collection synced.',
    mutationId: mutation.id,
    entityType: 'proofOfCollection',
    entityId: proofId,
  });

  return proofId;
}

async function resolveRemoteProofId(mutation: OfflineMutation): Promise<string | undefined> {
  const payload = mutation.payload as StopPayload;
  const patch = payload.patch ?? {};
  const existingRemoteProofId = typeof patch.proof_of_collection_id === 'string'
    ? patch.proof_of_collection_id
    : undefined;

  if (existingRemoteProofId) return existingRemoteProofId;

  const dependency = mutation.dependencies.find((item) => item.clientMutationId || item.entityId);
  const dependencyMutation = dependency?.clientMutationId
    ? await getMutationByClientMutationId(dependency.clientMutationId)
    : null;

  if (dependencyMutation?.remoteEntityId) return dependencyMutation.remoteEntityId;

  const clientProofId = payload.input?.clientProofId;
  if (!clientProofId) return undefined;

  const proofMutation = await getMutationByEntity('proofOfCollection', clientProofId);
  return proofMutation?.remoteEntityId;
}

async function syncStopMutation(mutation: OfflineMutation): Promise<void> {
  const payload = mutation.payload as StopPayload;
  const stopId = payload.stopId ?? mutation.entityId;
  const patch = { ...(payload.patch ?? {}) };

  if (!stopId) {
    throw new Error('Queued stop status update is missing stopId.');
  }

  const remoteProofId = await resolveRemoteProofId(mutation);
  const clientProofId = payload.input?.clientProofId;
  if (clientProofId && !patch.proof_of_collection_id && !remoteProofId) {
    throw new Error('Waiting for queued proof to sync before route stop completion.');
  }

  if (remoteProofId && !patch.proof_of_collection_id) {
    patch.proof_of_collection_id = remoteProofId;
  }

  const { error } = await supabase
    .from('driver_route_stops')
    .update(patch as never)
    .eq('id', stopId);

  if (error) throw error;

  await markMutationSynced(mutation.id, {
    remoteEntityId: stopId,
    remoteResult: { stopId, proofOfCollectionId: remoteProofId ?? patch.proof_of_collection_id ?? null },
  });

  await upsertRouteStopLocalState({
    stopId,
    routeId: payload.routeId,
    userId: mutation.userId,
    status: payload.input?.status ?? String(patch.status ?? 'completed'),
    syncStatus: 'synced',
    proofClientId: clientProofId,
    proofOfCollectionId: typeof (remoteProofId ?? patch.proof_of_collection_id) === 'string'
      ? String(remoteProofId ?? patch.proof_of_collection_id)
      : undefined,
    completionClientId: payload.input?.clientStopCompletionId,
    completedAt: payload.input?.completedAt,
    collectedOilKg: payload.input?.collectedOilKg,
    containersPicked: payload.input?.containersPicked,
    containersDropped: payload.input?.containersDropped,
    productsDelivered: payload.input?.productsDelivered,
    lastMutationId: mutation.id,
    lastError: undefined,
  });

  await addSyncEvent({
    level: 'info',
    message: 'Route stop status synced.',
    mutationId: mutation.id,
    entityType: 'driverRouteStop',
    entityId: stopId,
  });
}

async function processMutation(mutation: OfflineMutation): Promise<'synced' | 'failed' | 'skipped'> {
  if (!isSupportedMutation(mutation)) return 'skipped';
  if (mutation.retryCount >= mutation.maxRetries) return 'skipped';

  await markMutationSyncing(mutation.id);

  try {
    if (isProofMutation(mutation)) {
      await syncProofMutation(mutation);
      return 'synced';
    }

    if (isStopMutation(mutation)) {
      await syncStopMutation(mutation);
      return 'synced';
    }

    if (isGenericSupabaseMutation(mutation)) {
      await syncGenericSupabaseMutation(mutation);
      return 'synced';
    }

    return 'skipped';
  } catch (error) {
    const message = getErrorMessage(error);
    await markMutationFailed(mutation.id, message);
    await addSyncEvent({
      level: 'error',
      message,
      mutationId: mutation.id,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
    });
    return 'failed';
  }
}

export async function flushOfflineSyncQueue(): Promise<OfflineSyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0, skipped: 0 };
  }

  const pending = (await getPendingMutations()).filter(isSupportedMutation);
  const proofMutations = pending.filter(isProofMutation);
  const stopMutations = pending.filter(isStopMutation);
  const genericMutations = pending.filter((mutation) =>
    !isProofMutation(mutation) && !isStopMutation(mutation) && isGenericSupabaseMutation(mutation)
  );

  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const mutation of [...proofMutations, ...stopMutations, ...genericMutations]) {
    const result = await processMutation(mutation);
    if (result === 'synced') synced++;
    else if (result === 'failed') failed++;
    else skipped++;
  }

  await cleanupSyncedOfflineData(0);
  await cleanupExpiredOfflineData(30 * 24 * 60 * 60 * 1000);

  return { synced, failed, skipped };
}

export async function countPendingOfflineSyncMutations(): Promise<number> {
  const pending = await getPendingMutations();
  return pending.filter(isSupportedMutation).length;
}
