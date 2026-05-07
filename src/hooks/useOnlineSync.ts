import { useEffect, useState, useCallback } from 'react';
import { flushQueue, countPending } from '@/lib/offlineQueue';
import { countPendingOfflineSyncMutations, flushOfflineSyncQueue } from '@/lib/offlineSync/syncEngine';

/**
 * Tracks online/offline status and pending sync queue size.
 * Auto-flushes the queue when coming back online and every 30s.
 */
export function useOnlineSync() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    const [legacyPending, driverPending] = await Promise.all([
      countPending().catch(() => 0),
      countPendingOfflineSyncMutations().catch(() => 0),
    ]);
    setPending(legacyPending + driverPending);
  }, []);

  const flush = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      await flushQueue();
      await flushOfflineSyncQueue();
    } finally {
      setSyncing(false);
      await refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => {
    refreshPending();
    const onOnline = () => { setOnline(true); void flush(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // periodic flush
    const id = window.setInterval(() => {
      if (navigator.onLine) void flush();
      else void refreshPending();
    }, 30_000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.clearInterval(id);
    };
  }, [flush, refreshPending]);

  return { online, pending, syncing, flush };
}
