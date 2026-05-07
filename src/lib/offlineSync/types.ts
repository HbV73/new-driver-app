export type OfflineMutationOperation =
  | 'create'
  | 'update'
  | 'upsert'
  | 'delete'
  | 'uploadMedia'
  | 'workflow';

export type OfflineMutationStatus =
  | 'pending'
  | 'syncing'
  | 'failed'
  | 'synced'
  | 'blocked'
  | 'conflict';

export type OfflineWorkflowType =
  | 'visitCompletion'
  | 'proofOfCollection'
  | 'stopStatusUpdate'
  | 'expense'
  | 'odometerPhoto'
  | 'damageReport'
  | 'backupRequest'
  | 'deliverySignature'
  | 'generic';

export type OfflineEntityType =
  | 'driverRouteStop'
  | 'proofOfCollection'
  | 'miscExpense'
  | 'damageReport'
  | 'backupRequest'
  | 'deliverySignature'
  | 'media'
  | 'generic';

export type OfflineMediaKind =
  | 'photo'
  | 'signature'
  | 'receipt'
  | 'document'
  | 'other';

export type OfflineMediaStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'orphaned';

export type OfflineSyncEventLevel = 'info' | 'warning' | 'error';

export interface OfflineMutationDependency {
  mutationId?: string;
  clientMutationId?: string;
  entityType?: OfflineEntityType;
  entityId?: string;
  reason?: string;
}

export interface OfflineMutation {
  id: string;
  clientMutationId: string;
  userId: string;
  provider: 'supabase' | 'rest' | 'unknown';
  workflowType: OfflineWorkflowType;
  operation: OfflineMutationOperation;
  entityType: OfflineEntityType;
  entityId?: string;
  payload: Record<string, unknown>;
  endpoint?: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  dependencies: OfflineMutationDependency[];
  mediaIds: string[];
  remoteEntityId?: string;
  remoteResult?: Record<string, unknown>;
  status: OfflineMutationStatus;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  conflictReason?: string;
  queuedAt: number;
  updatedAt: number;
  lastAttemptAt?: number;
  syncedAt?: number;
}

export interface EnqueueMutationInput {
  userId: string;
  provider?: OfflineMutation['provider'];
  workflowType?: OfflineWorkflowType;
  operation: OfflineMutationOperation;
  entityType: OfflineEntityType;
  entityId?: string;
  payload: Record<string, unknown>;
  endpoint?: string;
  method?: OfflineMutation['method'];
  dependencies?: OfflineMutationDependency[];
  mediaIds?: string[];
  clientMutationId?: string;
  maxRetries?: number;
}

export interface OfflineMedia {
  id: string;
  clientMediaId: string;
  userId: string;
  workflowId?: string;
  mutationId?: string;
  kind: OfflineMediaKind;
  localUri?: string;
  localPath?: string;
  webPath?: string;
  blob?: Blob;
  mimeType?: string;
  format?: string;
  sizeBytes?: number;
  capturedAt?: string;
  remotePath?: string;
  remoteUrl?: string;
  uploadStatus: OfflineMediaStatus;
  retryCount: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
  uploadedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface PutMediaInput {
  userId: string;
  kind: OfflineMediaKind;
  clientMediaId?: string;
  workflowId?: string;
  mutationId?: string;
  localUri?: string;
  localPath?: string;
  webPath?: string;
  blob?: Blob;
  mimeType?: string;
  format?: string;
  sizeBytes?: number;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RouteStopLocalState {
  stopId: string;
  routeId?: string;
  userId: string;
  status: string;
  syncStatus: OfflineMutationStatus;
  proofClientId?: string;
  proofOfCollectionId?: string;
  completionClientId?: string;
  completedAt?: string | null;
  collectedOilKg?: number | null;
  containersPicked?: Array<Record<string, unknown>>;
  containersDropped?: Array<Record<string, unknown>>;
  productsDelivered?: Array<Record<string, unknown>>;
  lastMutationId?: string;
  lastError?: string;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface UpsertRouteStopLocalStateInput {
  stopId: string;
  routeId?: string;
  userId: string;
  status: string;
  syncStatus?: OfflineMutationStatus;
  proofClientId?: string;
  proofOfCollectionId?: string;
  completionClientId?: string;
  completedAt?: string | null;
  collectedOilKg?: number | null;
  containersPicked?: Array<Record<string, unknown>>;
  containersDropped?: Array<Record<string, unknown>>;
  productsDelivered?: Array<Record<string, unknown>>;
  lastMutationId?: string;
  lastError?: string;
  metadata?: Record<string, unknown>;
}

export interface SyncEvent {
  id: string;
  level: OfflineSyncEventLevel;
  message: string;
  mutationId?: string;
  mediaId?: string;
  entityType?: OfflineEntityType;
  entityId?: string;
  createdAt: number;
  details?: Record<string, unknown>;
}
