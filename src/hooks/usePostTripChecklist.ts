import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPlatformEvent } from '@/lib/platformSync';

const provider = import.meta.env.VITE_DRIVER_API_PROVIDER ?? 'supabase';
const REST_POSTTRIP_KEY = 'rs_rest_posttrip_today';

export interface PostTripChecklist {
  id: string;
  user_id: string;
  log_date: string;
  end_km: number | null;
  fuel_level_percent: number | null;
  adblue_refilled: boolean;
  vehicle_locked: boolean;
  fridge_off: boolean;
  cargo_area_clean: boolean;
  bins_returned: boolean;
  paperwork_submitted: boolean;
  keys_handed_over: boolean;
  damage_noticed: boolean;
  damage_description: string | null;
  cash_handed_over: boolean;
  cash_amount_eur: number | null;
  notes: string | null;
  signature_data: string | null;
  photo_urls: string[] | null;
  completed_at: string;
  odometer_photo_url: string | null;
  fuel_gauge_photo_url: string | null;
  odometer_photo_gps_lat: number | null;
  odometer_photo_gps_lng: number | null;
  personal_km_deviation: number | null;
}

export interface PostTripInput {
  log_date?: string;
  end_km?: number | null;
  fuel_level_percent?: number | null;
  adblue_refilled?: boolean;
  vehicle_locked: boolean;
  fridge_off: boolean;
  cargo_area_clean: boolean;
  bins_returned: boolean;
  paperwork_submitted: boolean;
  keys_handed_over: boolean;
  damage_noticed?: boolean;
  damage_description?: string;
  cash_handed_over?: boolean;
  cash_amount_eur?: number | null;
  notes?: string;
  signature_data?: string | null;
  odometer_photo_url?: string | null;
  fuel_gauge_photo_url?: string | null;
  odometer_photo_gps_lat?: number | null;
  odometer_photo_gps_lng?: number | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function usePostTripChecklist(date?: string) {
  const logDate = date ?? today();
  const [item, setItem] = useState<PostTripChecklist | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (provider === 'rest') {
      const raw = localStorage.getItem(REST_POSTTRIP_KEY);
      const parsed = raw ? JSON.parse(raw) as PostTripChecklist : null;
      const todayItem = parsed?.log_date === logDate ? parsed : null;
      setItem(todayItem);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setItem(null); setLoading(false); return; }
    const { data } = await supabase
      .from('post_trip_checklists')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', logDate)
      .maybeSingle();
    setItem((data as unknown as PostTripChecklist) ?? null);
    setLoading(false);
  }, [logDate]);

  useEffect(() => { void load(); }, [load]);

  const submit = useCallback(async (input: PostTripInput) => {
    if (provider === 'rest') {
      const row: PostTripChecklist = {
        id: `rest-posttrip-${Date.now()}`,
        user_id: 'rest-user',
        log_date: input.log_date ?? logDate,
        end_km: input.end_km ?? null,
        fuel_level_percent: input.fuel_level_percent ?? null,
        adblue_refilled: input.adblue_refilled ?? false,
        vehicle_locked: input.vehicle_locked,
        fridge_off: input.fridge_off,
        cargo_area_clean: input.cargo_area_clean,
        bins_returned: input.bins_returned,
        paperwork_submitted: input.paperwork_submitted,
        keys_handed_over: input.keys_handed_over,
        damage_noticed: input.damage_noticed ?? false,
        damage_description: input.damage_description ?? '',
        cash_handed_over: input.cash_handed_over ?? false,
        cash_amount_eur: input.cash_amount_eur ?? null,
        notes: input.notes ?? '',
        signature_data: input.signature_data ?? null,
        photo_urls: [],
        completed_at: new Date().toISOString(),
        odometer_photo_url: input.odometer_photo_url ?? null,
        fuel_gauge_photo_url: input.fuel_gauge_photo_url ?? null,
        odometer_photo_gps_lat: input.odometer_photo_gps_lat ?? null,
        odometer_photo_gps_lng: input.odometer_photo_gps_lng ?? null,
        personal_km_deviation: null,
      };
      localStorage.setItem(REST_POSTTRIP_KEY, JSON.stringify(row));
      void sendPlatformEvent('post_trip_checklist', row.log_date, { id: row.id, ...row });
      await load();
      return row;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('not authenticated');
    const row = {
      user_id: user.id,
      log_date: input.log_date ?? logDate,
      end_km: input.end_km ?? null,
      fuel_level_percent: input.fuel_level_percent ?? null,
      adblue_refilled: input.adblue_refilled ?? false,
      vehicle_locked: input.vehicle_locked,
      fridge_off: input.fridge_off,
      cargo_area_clean: input.cargo_area_clean,
      bins_returned: input.bins_returned,
      paperwork_submitted: input.paperwork_submitted,
      keys_handed_over: input.keys_handed_over,
      damage_noticed: input.damage_noticed ?? false,
      damage_description: input.damage_description ?? '',
      cash_handed_over: input.cash_handed_over ?? false,
      cash_amount_eur: input.cash_amount_eur ?? null,
      notes: input.notes ?? '',
      signature_data: input.signature_data ?? null,
      odometer_photo_url: input.odometer_photo_url ?? null,
      fuel_gauge_photo_url: input.fuel_gauge_photo_url ?? null,
      odometer_photo_gps_lat: input.odometer_photo_gps_lat ?? null,
      odometer_photo_gps_lng: input.odometer_photo_gps_lng ?? null,
    };
    const { data, error } = await supabase
      .from('post_trip_checklists')
      .upsert(row as never, { onConflict: 'user_id,log_date' })
      .select()
      .single();
    if (error) throw error;
    void sendPlatformEvent('post_trip_checklist', row.log_date, { id: (data as { id: string }).id, ...row });
    await load();
    return data as unknown as PostTripChecklist;
  }, [logDate, load]);

  return { item, loading, submit, reload: load };
}
