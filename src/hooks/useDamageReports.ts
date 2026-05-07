import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPlatformEvent } from '@/lib/platformSync';
import { enqueueSupabaseInsert, shouldQueueForOffline } from '@/lib/offlineSync/workflowQueue';

export type DamageItemType = 'bin' | 'barrel_60' | 'barrel_30' | 'fresh_food' | 'product' | 'other';
export type DamageCause = 'drop' | 'collision' | 'wear' | 'spoiled' | 'temperature' | 'customer_caused' | 'lost' | 'unknown' | 'other';
export type DamageStatus = 'reported' | 'reviewed' | 'replaced' | 'written_off' | 'rejected';

export interface DamageReport {
  id: string;
  user_id: string;
  visit_ref: string | null;
  customer_name: string | null;
  occurred_at: string;
  item_type: DamageItemType;
  item_label: string;
  quantity: number;
  estimated_value_eur: number | null;
  cause: DamageCause;
  description: string;
  photo_urls: string[] | null;
  voice_note_url: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  status: DamageStatus;
  admin_note: string | null;
  created_at: string;
}

export interface DamageReportInput {
  item_type: DamageItemType;
  item_label: string;
  quantity: number;
  estimated_value_eur?: number | null;
  cause: DamageCause;
  description?: string;
  photo_urls?: string[];
  visit_ref?: string | null;
  customer_name?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  occurred_at?: string;
}

export function useDamageReports() {
  const [items, setItems] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from('damage_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(100);
    setItems((data ?? []) as DamageReport[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addReport = useCallback(async (input: DamageReportInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const row = {
      user_id: user.id,
      item_type: input.item_type,
      item_label: input.item_label,
      quantity: input.quantity,
      estimated_value_eur: input.estimated_value_eur ?? null,
      cause: input.cause,
      description: input.description ?? '',
      photo_urls: input.photo_urls ?? [],
      visit_ref: input.visit_ref ?? null,
      customer_name: input.customer_name ?? null,
      gps_lat: input.gps_lat ?? null,
      gps_lng: input.gps_lng ?? null,
      occurred_at: input.occurred_at ?? new Date().toISOString(),
    };

    let data: unknown = null;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const mutation = await enqueueSupabaseInsert({
        userId: user.id,
        workflowType: 'damageReport',
        entityType: 'damageReport',
        table: 'damage_reports',
        remotePayload: row,
      });
      await load();
      return { id: mutation.entityId, ...row, status: 'reported', created_at: new Date().toISOString() } as DamageReport;
    }

    try {
      const result = await supabase
        .from('damage_reports')
        .insert(row)
        .select()
        .single();

      if (result.error) throw result.error;
      data = result.data;
    } catch (error) {
      if (!shouldQueueForOffline(error)) throw error;
      const mutation = await enqueueSupabaseInsert({
        userId: user.id,
        workflowType: 'damageReport',
        entityType: 'damageReport',
        table: 'damage_reports',
        remotePayload: row,
      });
      await load();
      return { id: mutation.entityId, ...row, status: 'reported', created_at: new Date().toISOString() } as DamageReport;
    }

    // Sync to admin platform (non-blocking)
    void sendPlatformEvent(
      'incident_report',
      new Date().toISOString().slice(0, 10),
      { kind: 'damage_report', ...row, id: (data as { id: string }).id }
    );

    await load();
    return data as DamageReport;
  }, [load]);

  return { items, loading, reload: load, addReport };
}
