/**
 * Offline-first sync queue using IndexedDB.
 * Queues mutations when offline; flushes them to Supabase when back online.
 */
import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'recycle_offline_queue';
const STORE = 'mutations';
const DB_VERSION = 1;

export type QueueOp = 'insert' | 'update' | 'upsert';

export interface QueueItem {
  id: string;
  user_id: string;
  op: QueueOp;
  table: string;
  payload: Record<string, unknown>;
  match?: Record<string, unknown>;
  client_id: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
  last_error?: string;
  queued_at: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('queued_at', 'queued_at');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function uuid() {
  return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function enqueue(item: Omit<QueueItem, 'id' | 'retry_count' | 'status' | 'queued_at' | 'client_id'> & { client_id?: string }) {
  const db = await openDB();
  const full: QueueItem = {
    id: uuid(),
    client_id: item.client_id ?? uuid(),
    retry_count: 0,
    status: 'pending',
    queued_at: Date.now(),
    ...item,
  };
  return new Promise<QueueItem>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(full);
    tx.oncomplete = () => resolve(full);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPending(): Promise<QueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as QueueItem[]).filter(i => i.status !== 'syncing'));
    req.onerror = () => reject(req.error);
  });
}

export async function countPending(): Promise<number> {
  const items = await getPending();
  return items.filter(i => i.status === 'pending' || i.status === 'failed').length;
}

async function updateItem(item: QueueItem) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteItem(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Try to sync all pending items. Returns count of successfully synced items.
 */
export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) return { synced: 0, failed: 0 };
  const items = await getPending();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    if (item.retry_count >= 5) continue;
    try {
      // mark syncing
      await updateItem({ ...item, status: 'syncing' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tbl = supabase.from(item.table as any);
      let res;
      if (item.op === 'insert') {
        res = await tbl.insert(item.payload as never);
      } else if (item.op === 'upsert') {
        res = await tbl.upsert(item.payload as never);
      } else {
        // update — needs match
        let q = tbl.update(item.payload as never);
        Object.entries(item.match ?? {}).forEach(([k, v]) => {
          q = q.eq(k, v as never);
        });
        res = await q;
      }
      if (res.error) throw res.error;
      await deleteItem(item.id);
      synced++;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      await updateItem({
        ...item,
        status: 'failed',
        retry_count: item.retry_count + 1,
        last_error: err,
      });
      failed++;
    }
  }
  return { synced, failed };
}

/**
 * Wrapper: try direct supabase mutation; if offline or fails, enqueue.
 * Returns { synced: true } if completed online, { queued: true } if queued.
 */
export async function syncOrQueue(
  userId: string,
  op: QueueOp,
  table: string,
  payload: Record<string, unknown>,
  match?: Record<string, unknown>,
): Promise<{ synced: boolean; queued: boolean; error?: string }> {
  if (navigator.onLine) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tbl = supabase.from(table as any);
      let res;
      if (op === 'insert') res = await tbl.insert(payload as never);
      else if (op === 'upsert') res = await tbl.upsert(payload as never);
      else {
        let q = tbl.update(payload as never);
        Object.entries(match ?? {}).forEach(([k, v]) => { q = q.eq(k, v as never); });
        res = await q;
      }
      if (res.error) throw res.error;
      return { synced: true, queued: false };
    } catch (e) {
      // fall through and enqueue
      await enqueue({ user_id: userId, op, table, payload, match });
      return { synced: false, queued: true, error: e instanceof Error ? e.message : String(e) };
    }
  }
  await enqueue({ user_id: userId, op, table, payload, match });
  return { synced: false, queued: true };
}
