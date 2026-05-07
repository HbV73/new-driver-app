import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPlatformEvent } from '@/lib/platformSync';
import { enqueueSupabaseInsert, enqueueSupabaseUpdate, shouldQueueForOffline } from '@/lib/offlineSync/workflowQueue';

export type BackupKind = 'extra_driver' | 'vehicle_swap' | 'fuel' | 'tool_equipment' | 'translator' | 'medical' | 'other';
export type BackupUrgency = 'low' | 'normal' | 'high' | 'critical';
export type BackupStatus = 'open' | 'acknowledged' | 'dispatched' | 'resolved' | 'cancelled';

export interface BackupRequest {
  id: string;
  user_id: string;
  kind: BackupKind;
  urgency: BackupUrgency;
  status: BackupStatus;
  title: string;
  description: string;
  current_lat: number | null;
  current_lng: number | null;
  current_address: string | null;
  estimated_delay_minutes: number | null;
  requested_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  admin_note: string | null;
  created_at: string;
}

export interface BackupRequestInput {
  kind: BackupKind;
  urgency: BackupUrgency;
  title: string;
  description?: string;
  current_lat?: number | null;
  current_lng?: number | null;
  current_address?: string | null;
  estimated_delay_minutes?: number | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function useBackupRequests() {
  const [items, setItems] = useState<BackupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from('backup_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(50);
    setItems((data ?? []) as unknown as BackupRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = useCallback(async (input: BackupRequestInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('not authenticated');
    const row = {
      user_id: user.id,
      kind: input.kind,
      urgency: input.urgency,
      title: input.title,
      description: input.description ?? '',
      current_lat: input.current_lat ?? null,
      current_lng: input.current_lng ?? null,
      current_address: input.current_address ?? null,
      estimated_delay_minutes: input.estimated_delay_minutes ?? null,
    };
    let data: unknown = null;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const mutation = await enqueueSupabaseInsert({
        userId: user.id,
        workflowType: 'backupRequest',
        entityType: 'backupRequest',
        table: 'backup_requests',
        remotePayload: row,
      });
      await load();
      return { id: mutation.entityId, ...row, status: 'open', requested_at: new Date().toISOString(), created_at: new Date().toISOString() } as unknown as BackupRequest;
    }

    try {
      const result = await supabase.from('backup_requests').insert(row as never).select().single();
      if (result.error) throw result.error;
      data = result.data;
    } catch (error) {
      if (!shouldQueueForOffline(error)) throw error;
      const mutation = await enqueueSupabaseInsert({
        userId: user.id,
        workflowType: 'backupRequest',
        entityType: 'backupRequest',
        table: 'backup_requests',
        remotePayload: row,
      });
      await load();
      return { id: mutation.entityId, ...row, status: 'open', requested_at: new Date().toISOString(), created_at: new Date().toISOString() } as unknown as BackupRequest;
    }
    void sendPlatformEvent('backup_request', today(), { id: (data as { id: string }).id, ...row });
    await load();
    return data as unknown as BackupRequest;
  }, [load]);

  const cancel = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('not authenticated');

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await enqueueSupabaseUpdate({
        userId: user.id,
        workflowType: 'backupRequest',
        entityType: 'backupRequest',
        table: 'backup_requests',
        entityId: id,
        remotePayload: { status: 'cancelled' as BackupStatus },
        match: { id },
      });
      await load();
      return;
    }
    try {
      const { error } = await supabase.from('backup_requests').update({ status: 'cancelled' as BackupStatus } as never).eq('id', id);
      if (error) throw error;
    } catch (error) {
      if (!shouldQueueForOffline(error)) throw error;
      await enqueueSupabaseUpdate({
        userId: user.id,
        workflowType: 'backupRequest',
        entityType: 'backupRequest',
        table: 'backup_requests',
        entityId: id,
        remotePayload: { status: 'cancelled' as BackupStatus },
        match: { id },
      });
      await load();
      return;
    }
    void sendPlatformEvent('backup_request_updated', today(), { id, status: 'cancelled' });
    await load();
  }, [load]);

  const openCount = items.filter(i => i.status === 'open' || i.status === 'acknowledged').length;

  return { items, loading, openCount, create, cancel, reload: load };
}
