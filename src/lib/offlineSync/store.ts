import type {
  EnqueueMutationInput,
  OfflineMedia,
  OfflineMutation,
  OfflineMutationStatus,
  PutMediaInput,
  RouteStopLocalState,
  SyncEvent,
  UpsertRouteStopLocalStateInput,
} from './types';
import { decryptOfflineRecord, encryptOfflineRecord } from '@/lib/security/offlineCrypto';

const DB_NAME = 'recycle_driver_offline_sync';
const DB_VERSION = 1;

const MUTATIONS_STORE = 'mutations';
const MEDIA_STORE = 'media';
const ROUTE_STOP_STATE_STORE = 'routeStopLocalState';
const SYNC_EVENTS_STORE = 'syncEvents';

let dbPromise: Promise<IDBDatabase> | null = null;

export function createClientId(prefix = 'client'): string {
  const random = (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

async function decryptMutation(mutation: OfflineMutation | undefined): Promise<OfflineMutation | undefined> {
  if (!mutation) return undefined;
  return {
    ...mutation,
    payload: await decryptOfflineRecord<Record<string, unknown>>(mutation.payload) ?? {},
  };
}

async function decryptMedia(media: OfflineMedia | undefined): Promise<OfflineMedia | undefined> {
  if (!media) return undefined;
  return {
    ...media,
    metadata: await decryptOfflineRecord<Record<string, unknown>>(media.metadata),
  };
}

function createIndexIfMissing(store: IDBObjectStore, name: string, keyPath: string | string[], options?: IDBIndexParameters) {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath, options);
  }
}

function ensureStores(db: IDBDatabase) {
  if (!db.objectStoreNames.contains(MUTATIONS_STORE)) {
    const store = db.createObjectStore(MUTATIONS_STORE, { keyPath: 'id' });
    createIndexIfMissing(store, 'clientMutationId', 'clientMutationId', { unique: true });
    createIndexIfMissing(store, 'status', 'status');
    createIndexIfMissing(store, 'queuedAt', 'queuedAt');
    createIndexIfMissing(store, 'workflowType', 'workflowType');
    createIndexIfMissing(store, 'entity', ['entityType', 'entityId']);
    createIndexIfMissing(store, 'userStatus', ['userId', 'status']);
  }

  if (!db.objectStoreNames.contains(MEDIA_STORE)) {
    const store = db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
    createIndexIfMissing(store, 'clientMediaId', 'clientMediaId', { unique: true });
    createIndexIfMissing(store, 'uploadStatus', 'uploadStatus');
    createIndexIfMissing(store, 'workflowId', 'workflowId');
    createIndexIfMissing(store, 'mutationId', 'mutationId');
    createIndexIfMissing(store, 'userStatus', ['userId', 'uploadStatus']);
  }

  if (!db.objectStoreNames.contains(ROUTE_STOP_STATE_STORE)) {
    const store = db.createObjectStore(ROUTE_STOP_STATE_STORE, { keyPath: 'stopId' });
    createIndexIfMissing(store, 'routeId', 'routeId');
    createIndexIfMissing(store, 'userId', 'userId');
    createIndexIfMissing(store, 'syncStatus', 'syncStatus');
    createIndexIfMissing(store, 'userStatus', ['userId', 'syncStatus']);
  }

  if (!db.objectStoreNames.contains(SYNC_EVENTS_STORE)) {
    const store = db.createObjectStore(SYNC_EVENTS_STORE, { keyPath: 'id' });
    createIndexIfMissing(store, 'createdAt', 'createdAt');
    createIndexIfMissing(store, 'level', 'level');
    createIndexIfMissing(store, 'mutationId', 'mutationId');
    createIndexIfMissing(store, 'mediaId', 'mediaId');
  }
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => ensureStores(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Offline sync database upgrade is blocked by another open tab.'));
  });

  return dbPromise;
}

function transaction<T>(
  stores: string | string[],
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction) => T,
): Promise<T> {
  return openDB().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    let result: T;

    try {
      result = run(tx);
    } catch (error) {
      reject(error);
      return;
    }

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Offline sync transaction aborted.'));
  }));
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getMutationById(id: string): Promise<OfflineMutation | undefined> {
  const db = await openDB();
  const tx = db.transaction(MUTATIONS_STORE, 'readonly');
  const result = await requestToPromise(tx.objectStore(MUTATIONS_STORE).get(id) as IDBRequest<OfflineMutation | undefined>);
  return decryptMutation(result);
}

async function putMutation(mutation: OfflineMutation): Promise<OfflineMutation> {
  const stored: OfflineMutation = {
    ...mutation,
    payload: await encryptOfflineRecord(mutation.payload) as Record<string, unknown>,
  };
  await transaction(MUTATIONS_STORE, 'readwrite', (tx) => {
    tx.objectStore(MUTATIONS_STORE).put(stored);
  });
  return mutation;
}

async function patchMutation(
  id: string,
  patch: Partial<OfflineMutation>,
): Promise<OfflineMutation | null> {
  const existing = await getMutationById(id);
  if (!existing) return null;

  const updated: OfflineMutation = {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  };

  return putMutation(updated);
}

export async function enqueueMutation(input: EnqueueMutationInput): Promise<OfflineMutation> {
  const now = Date.now();
  const mutation: OfflineMutation = {
    id: createClientId('mutation'),
    clientMutationId: input.clientMutationId ?? createClientId('cm'),
    userId: input.userId,
    provider: input.provider ?? 'unknown',
    workflowType: input.workflowType ?? 'generic',
    operation: input.operation,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload,
    endpoint: input.endpoint,
    method: input.method,
    dependencies: input.dependencies ?? [],
    mediaIds: input.mediaIds ?? [],
    status: 'pending',
    retryCount: 0,
    maxRetries: input.maxRetries ?? 8,
    queuedAt: now,
    updatedAt: now,
  };

  return putMutation(mutation);
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
  const db = await openDB();
  const tx = db.transaction(MUTATIONS_STORE, 'readonly');
  const store = tx.objectStore(MUTATIONS_STORE);
  const all = await requestToPromise(store.getAll() as IDBRequest<OfflineMutation[]>);
  const decrypted = await Promise.all(all.map((item) => decryptMutation(item)));
  return decrypted
    .filter((item): item is OfflineMutation => Boolean(item))
    .filter((item) => item.status === 'pending' || item.status === 'failed' || item.status === 'blocked')
    .sort((a, b) => a.queuedAt - b.queuedAt);
}

export async function markMutationSyncing(id: string): Promise<OfflineMutation | null> {
  return patchMutation(id, {
    status: 'syncing',
    lastAttemptAt: Date.now(),
  });
}

export async function markMutationFailed(id: string, error: string): Promise<OfflineMutation | null> {
  const existing = await getMutationById(id);
  if (!existing) return null;

  return patchMutation(id, {
    status: 'failed',
    retryCount: existing.retryCount + 1,
    lastError: error,
    lastAttemptAt: Date.now(),
  });
}

export async function markMutationSynced(
  id: string,
  result?: { remoteEntityId?: string; remoteResult?: Record<string, unknown> },
): Promise<OfflineMutation | null> {
  return patchMutation(id, {
    status: 'synced',
    lastError: undefined,
    remoteEntityId: result?.remoteEntityId,
    remoteResult: result?.remoteResult,
    syncedAt: Date.now(),
  });
}

export async function getMutationByClientMutationId(clientMutationId: string): Promise<OfflineMutation | null> {
  const db = await openDB();
  const tx = db.transaction(MUTATIONS_STORE, 'readonly');
  const result = await requestToPromise(
    tx.objectStore(MUTATIONS_STORE).index('clientMutationId').get(clientMutationId) as IDBRequest<OfflineMutation | undefined>,
  );
  return await decryptMutation(result) ?? null;
}

export async function getMutationByEntity(entityType: string, entityId: string): Promise<OfflineMutation | null> {
  const db = await openDB();
  const tx = db.transaction(MUTATIONS_STORE, 'readonly');
  const result = await requestToPromise(
    tx.objectStore(MUTATIONS_STORE).index('entity').get([entityType, entityId]) as IDBRequest<OfflineMutation | undefined>,
  );
  return await decryptMutation(result) ?? null;
}

export async function putMedia(input: PutMediaInput): Promise<OfflineMedia> {
  const now = Date.now();
  const media: OfflineMedia = {
    id: createClientId('media'),
    clientMediaId: input.clientMediaId ?? createClientId('cmda'),
    userId: input.userId,
    workflowId: input.workflowId,
    mutationId: input.mutationId,
    kind: input.kind,
    localUri: input.localUri,
    localPath: input.localPath,
    webPath: input.webPath,
    blob: input.blob,
    mimeType: input.mimeType,
    format: input.format,
    sizeBytes: input.sizeBytes,
    capturedAt: input.capturedAt,
    uploadStatus: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata,
  };

  const stored: OfflineMedia = {
    ...media,
    metadata: await encryptOfflineRecord(media.metadata) as Record<string, unknown> | undefined,
  };

  await transaction(MEDIA_STORE, 'readwrite', (tx) => {
    tx.objectStore(MEDIA_STORE).put(stored);
  });

  return media;
}

export async function getMedia(idOrClientMediaId: string): Promise<OfflineMedia | null> {
  const db = await openDB();
  const tx = db.transaction(MEDIA_STORE, 'readonly');
  const store = tx.objectStore(MEDIA_STORE);
  const byId = await requestToPromise(store.get(idOrClientMediaId) as IDBRequest<OfflineMedia | undefined>);
  if (byId) return await decryptMedia(byId) ?? null;

  const byClientId = await requestToPromise(
    store.index('clientMediaId').get(idOrClientMediaId) as IDBRequest<OfflineMedia | undefined>,
  );
  return await decryptMedia(byClientId) ?? null;
}

async function patchMedia(id: string, patch: Partial<OfflineMedia>): Promise<OfflineMedia | null> {
  const existing = await getMedia(id);
  if (!existing) return null;

  const updated: OfflineMedia = {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  };

  const stored: OfflineMedia = {
    ...updated,
    metadata: await encryptOfflineRecord(updated.metadata) as Record<string, unknown> | undefined,
  };

  await transaction(MEDIA_STORE, 'readwrite', (tx) => {
    tx.objectStore(MEDIA_STORE).put(stored);
  });

  return updated;
}

export async function markMediaUploading(id: string): Promise<OfflineMedia | null> {
  return patchMedia(id, { uploadStatus: 'uploading' });
}

export async function markMediaUploaded(
  id: string,
  remotePath: string,
  remoteUrl?: string,
): Promise<OfflineMedia | null> {
  return patchMedia(id, {
    uploadStatus: 'uploaded',
    remotePath,
    remoteUrl,
    lastError: undefined,
    uploadedAt: Date.now(),
  });
}

export async function markMediaFailed(id: string, error: string): Promise<OfflineMedia | null> {
  const existing = await getMedia(id);
  return patchMedia(id, {
    uploadStatus: 'failed',
    retryCount: (existing?.retryCount ?? 0) + 1,
    lastError: error,
  });
}

export async function getMediaBatch(ids: string[]): Promise<OfflineMedia[]> {
  const results = await Promise.all(ids.map((id) => getMedia(id)));
  return results.filter((item): item is OfflineMedia => Boolean(item));
}

async function deleteMedia(id: string): Promise<void> {
  await transaction(MEDIA_STORE, 'readwrite', (tx) => {
    tx.objectStore(MEDIA_STORE).delete(id);
  });
}

async function deleteMutation(id: string): Promise<void> {
  await transaction(MUTATIONS_STORE, 'readwrite', (tx) => {
    tx.objectStore(MUTATIONS_STORE).delete(id);
  });
}

export async function upsertRouteStopLocalState(
  input: UpsertRouteStopLocalStateInput,
): Promise<RouteStopLocalState> {
  const now = Date.now();
  const existing = await getRouteStopLocalState(input.stopId);

  const state: RouteStopLocalState = {
    ...existing,
    ...input,
    syncStatus: input.syncStatus ?? existing?.syncStatus ?? 'pending',
    updatedAt: now,
  };

  await transaction(ROUTE_STOP_STATE_STORE, 'readwrite', (tx) => {
    tx.objectStore(ROUTE_STOP_STATE_STORE).put(state);
  });

  return state;
}

export async function getRouteStopLocalState(stopId: string): Promise<RouteStopLocalState | null> {
  const db = await openDB();
  const tx = db.transaction(ROUTE_STOP_STATE_STORE, 'readonly');
  const result = await requestToPromise(
    tx.objectStore(ROUTE_STOP_STATE_STORE).get(stopId) as IDBRequest<RouteStopLocalState | undefined>,
  );
  return result ?? null;
}

export async function addSyncEvent(event: Omit<SyncEvent, 'id' | 'createdAt'>): Promise<SyncEvent> {
  const full: SyncEvent = {
    id: createClientId('sync_event'),
    createdAt: Date.now(),
    ...event,
  };

  await transaction(SYNC_EVENTS_STORE, 'readwrite', (tx) => {
    tx.objectStore(SYNC_EVENTS_STORE).put(full);
  });

  return full;
}

export async function getMutationsByStatus(status: OfflineMutationStatus): Promise<OfflineMutation[]> {
  const db = await openDB();
  const tx = db.transaction(MUTATIONS_STORE, 'readonly');
  const result = await requestToPromise(
    tx.objectStore(MUTATIONS_STORE).index('status').getAll(status) as IDBRequest<OfflineMutation[]>,
  );
  const decrypted = await Promise.all(result.map((item) => decryptMutation(item)));
  return decrypted
    .filter((item): item is OfflineMutation => Boolean(item))
    .sort((a, b) => a.queuedAt - b.queuedAt);
}

export async function cleanupSyncedOfflineData(ttlMs = 0): Promise<{ mutationsRemoved: number; mediaRemoved: number }> {
  const db = await openDB();
  const tx = db.transaction(MUTATIONS_STORE, 'readonly');
  const allRaw = await requestToPromise(tx.objectStore(MUTATIONS_STORE).getAll() as IDBRequest<OfflineMutation[]>);
  const all = (await Promise.all(allRaw.map((item) => decryptMutation(item))))
    .filter((item): item is OfflineMutation => Boolean(item));
  const cutoff = Date.now() - ttlMs;
  const activeDependencies = new Set<string>();

  all
    .filter((item) => item.status !== 'synced')
    .forEach((item) => {
      item.dependencies.forEach((dependency) => {
        if (dependency.clientMutationId) activeDependencies.add(dependency.clientMutationId);
        if (dependency.entityId) activeDependencies.add(`${dependency.entityType ?? ''}:${dependency.entityId}`);
      });
    });

  const removable = all.filter((item) =>
    item.status === 'synced' &&
    (item.syncedAt ?? item.updatedAt) <= cutoff &&
    !activeDependencies.has(item.clientMutationId) &&
    !activeDependencies.has(`${item.entityType}:${item.entityId ?? ''}`)
  );

  let mediaRemoved = 0;
  for (const mutation of removable) {
    for (const mediaId of mutation.mediaIds) {
      await deleteMedia(mediaId);
      mediaRemoved++;
    }
    await deleteMutation(mutation.id);
  }

  return { mutationsRemoved: removable.length, mediaRemoved };
}

export async function cleanupExpiredOfflineData(ttlMs: number): Promise<{ mutationsRemoved: number; mediaRemoved: number }> {
  const db = await openDB();
  const cutoff = Date.now() - ttlMs;
  let mutationsRemoved = 0;
  let mediaRemoved = 0;

  const mutationTx = db.transaction(MUTATIONS_STORE, 'readonly');
  const mutations = await requestToPromise(
    mutationTx.objectStore(MUTATIONS_STORE).getAll() as IDBRequest<OfflineMutation[]>,
  );
  for (const mutation of mutations) {
    if ((mutation.syncedAt ?? mutation.updatedAt ?? mutation.queuedAt) < cutoff) {
      await deleteMutation(mutation.id);
      mutationsRemoved++;
    }
  }

  const mediaTx = db.transaction(MEDIA_STORE, 'readonly');
  const mediaItems = await requestToPromise(
    mediaTx.objectStore(MEDIA_STORE).getAll() as IDBRequest<OfflineMedia[]>,
  );
  for (const media of mediaItems) {
    if ((media.uploadedAt ?? media.updatedAt ?? media.createdAt) < cutoff) {
      await deleteMedia(media.id);
      mediaRemoved++;
    }
  }

  return { mutationsRemoved, mediaRemoved };
}
