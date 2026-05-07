import { enqueueMutation, putMedia, createClientId } from './store';
import type { OfflineEntityType, OfflineMediaKind, OfflineWorkflowType } from './types';

export const shouldQueueForOffline = (error?: unknown): boolean => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();
  return [
    'failed to fetch',
    'networkerror',
    'network error',
    'network request failed',
    'load failed',
    'timeout',
    'connection',
    'offline',
  ].some((needle) => normalized.includes(needle));
};

export async function putFileMedia(input: {
  userId: string;
  file: File | Blob;
  kind: OfflineMediaKind;
  workflowId?: string;
  clientMediaId?: string;
  metadata?: Record<string, unknown>;
}) {
  const mimeType = input.file.type || 'application/octet-stream';
  const format = mimeType.includes('/') ? mimeType.split('/')[1].replace('jpeg', 'jpg') : undefined;
  return putMedia({
    userId: input.userId,
    kind: input.kind,
    workflowId: input.workflowId,
    clientMediaId: input.clientMediaId,
    blob: input.file,
    mimeType,
    format,
    sizeBytes: input.file.size,
    capturedAt: new Date().toISOString(),
    metadata: input.metadata,
  });
}

export async function enqueueSupabaseInsert(input: {
  userId: string;
  workflowType: OfflineWorkflowType;
  entityType: OfflineEntityType;
  table: string;
  remotePayload: Record<string, unknown>;
  entityId?: string;
  clientMutationId?: string;
  mediaBindings?: Array<{ mediaId: string; targetField: string; mode?: 'replace' | 'appendArray' }>;
}) {
  return enqueueMutation({
    userId: input.userId,
    provider: 'supabase',
    workflowType: input.workflowType,
    operation: 'create',
    entityType: input.entityType,
    entityId: input.entityId ?? createClientId(input.entityType),
    clientMutationId: input.clientMutationId ?? createClientId(`${input.workflowType}_mutation`),
    mediaIds: input.mediaBindings?.map((binding) => binding.mediaId) ?? [],
    payload: {
      table: input.table,
      op: 'insert',
      remotePayload: input.remotePayload,
      mediaBindings: input.mediaBindings ?? [],
    },
  });
}

export async function enqueueSupabaseUpdate(input: {
  userId: string;
  workflowType: OfflineWorkflowType;
  entityType: OfflineEntityType;
  table: string;
  remotePayload: Record<string, unknown>;
  match: Record<string, unknown>;
  entityId?: string;
  clientMutationId?: string;
}) {
  return enqueueMutation({
    userId: input.userId,
    provider: 'supabase',
    workflowType: input.workflowType,
    operation: 'update',
    entityType: input.entityType,
    entityId: input.entityId,
    clientMutationId: input.clientMutationId ?? createClientId(`${input.workflowType}_mutation`),
    payload: {
      table: input.table,
      op: 'update',
      remotePayload: input.remotePayload,
      match: input.match,
    },
  });
}

export async function enqueueMediaOnlyUpload(input: {
  userId: string;
  workflowType: OfflineWorkflowType;
  mediaIds: string[];
  entityType?: OfflineEntityType;
  entityId?: string;
  clientMutationId?: string;
  metadata?: Record<string, unknown>;
}) {
  return enqueueMutation({
    userId: input.userId,
    provider: 'supabase',
    workflowType: input.workflowType,
    operation: 'uploadMedia',
    entityType: input.entityType ?? 'media',
    entityId: input.entityId ?? createClientId('media_upload'),
    clientMutationId: input.clientMutationId ?? createClientId(`${input.workflowType}_media_mutation`),
    mediaIds: input.mediaIds,
    payload: {
      mediaOnly: true,
      metadata: input.metadata ?? {},
    },
  });
}
