import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const provider = import.meta.env.VITE_DRIVER_API_PROVIDER ?? 'supabase';
const REST_PRETRIP_KEY = 'rs_rest_pretrip_today';
const REST_POSTTRIP_KEY = 'rs_rest_posttrip_today';

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
      if (provider === 'rest') {
        const preRaw = localStorage.getItem(REST_PRETRIP_KEY);
        const postRaw = localStorage.getItem(REST_POSTTRIP_KEY);
        const pre = preRaw ? JSON.parse(preRaw) as { start_km?: number; log_date?: string } : null;
        const post = postRaw ? JSON.parse(postRaw) as { end_km?: number; log_date?: string } : null;
        const today = new Date().toISOString().slice(0, 10);

        const hasPre = Boolean(pre && pre.log_date === today);
        const hasPost = Boolean(post && post.log_date === today);
        setStartKm(hasPre ? (pre?.start_km ?? null) : null);
        setHasPreTrip(hasPre);
        setEndKm(hasPost ? (post?.end_km ?? null) : null);
        setHasPostTrip(hasPost);
        return;
      }

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
