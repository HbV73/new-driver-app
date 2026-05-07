import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Reads today's start_km (from pre_trip_inspections) and end_km (from post_trip_checklists)
 * for the current user. Used to avoid asking the driver for KM values multiple times across
 * different screens (Pre-Trip → WorkTime → Post-Trip).
 */
export function useTodayKm() {
  const [startKm, setStartKm] = useState<number | null>(null);
  const [endKm, setEndKm] = useState<number | null>(null);
  const [hasPreTrip, setHasPreTrip] = useState(false);
  const [hasPostTrip, setHasPostTrip] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);

      const [{ data: pre }, { data: post }] = await Promise.all([
        supabase
          .from('pre_trip_inspections')
          .select('start_km')
          .eq('user_id', user.id)
          .eq('log_date', today)
          .maybeSingle(),
        supabase
          .from('post_trip_checklists')
          .select('end_km')
          .eq('user_id', user.id)
          .eq('log_date', today)
          .maybeSingle(),
      ]);

      setStartKm(pre?.start_km ?? null);
      setHasPreTrip(!!pre);
      setEndKm(post?.end_km ?? null);
      setHasPostTrip(!!post);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  return { startKm, endKm, hasPreTrip, hasPostTrip, loading, refresh };
}
