import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPlatformEvent } from '@/lib/platformSync';

const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export interface KmDeviationCheckResult {
  hasDeviation: boolean;
  deviationKm: number;
  yesterdayEndKm: number | null;
  alertId?: string;
}

export function useKmDeviationCheck(threshold = 30) {
  /**
   * Compares today's start_km with yesterday's end_km.
   * If diff > threshold → creates a km_deviation_alerts row and notifies admin.
   */
  const check = useCallback(async (todayStartKm: number): Promise<KmDeviationCheckResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasDeviation: false, deviationKm: 0, yesterdayEndKm: null };

    const { data: prev } = await supabase
      .from('post_trip_checklists')
      .select('end_km')
      .eq('user_id', user.id)
      .eq('log_date', yesterday())
      .maybeSingle();

    const yEnd = (prev as { end_km: number | null } | null)?.end_km ?? null;
    if (yEnd == null) return { hasDeviation: false, deviationKm: 0, yesterdayEndKm: null };

    const deviation = todayStartKm - yEnd;
    if (deviation <= threshold) {
      return { hasDeviation: false, deviationKm: deviation, yesterdayEndKm: yEnd };
    }

    const row = {
      user_id: user.id,
      log_date: today(),
      yesterday_end_km: yEnd,
      today_start_km: todayStartKm,
      deviation_km: deviation,
      threshold_km: threshold,
      status: 'pending' as const,
    };
    const { data, error } = await supabase
      .from('km_deviation_alerts')
      .insert(row as never)
      .select('id')
      .single();
    if (error) {
      console.warn('[kmDeviation] insert failed:', error);
      return { hasDeviation: true, deviationKm: deviation, yesterdayEndKm: yEnd };
    }
    const alertId = (data as { id: string }).id;
    void sendPlatformEvent('km_deviation_alert', today(), { id: alertId, ...row });
    return { hasDeviation: true, deviationKm: deviation, yesterdayEndKm: yEnd, alertId };
  }, [threshold]);

  const submitExplanation = useCallback(async (alertId: string, explanation: string) => {
    const { error } = await supabase
      .from('km_deviation_alerts')
      .update({ driver_explanation: explanation } as never)
      .eq('id', alertId);
    if (error) throw error;
    void sendPlatformEvent('km_deviation_alert', today(), { id: alertId, driver_explanation: explanation, updated: true });
  }, []);

  return { check, submitExplanation };
}
