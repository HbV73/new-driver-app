import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PING_INTERVAL_MS = 30_000; // 30s
const MIN_DISTANCE_M = 25; // skip ping if barely moved

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Streams the driver's location to backend every 30s while `enabled` is true.
 * Honors throttling: only inserts when moved > MIN_DISTANCE_M or every 2 minutes.
 */
export function useLiveLocation(enabled: boolean, activityLogId?: string | null) {
  const { user } = useAuth();
  const lastPos = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const watchId = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !user || !navigator.geolocation) return;

    const sendPing = (pos: GeolocationPosition) => {
      const now = Date.now();
      const cur = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const prev = lastPos.current;
      const moved = prev ? haversine(prev, cur) : Infinity;
      // Skip if barely moved AND last ping was < 2 min ago
      if (prev && moved < MIN_DISTANCE_M && now - prev.t < 120_000) return;

      lastPos.current = { ...cur, t: now };

      // Battery (best-effort)
      const navWithBattery = navigator as Navigator & { getBattery?: () => Promise<{ level: number }> };
      const batteryPromise = navWithBattery.getBattery
        ? navWithBattery.getBattery().then((b) => Math.round(b.level * 100)).catch(() => null)
        : Promise.resolve(null);

      void batteryPromise.then((battery) => {
        void supabase.from('driver_live_locations').insert({
          user_id: user.id,
          activity_log_id: activityLogId ?? null,
          lat: cur.lat,
          lng: cur.lng,
          speed_kmh: pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
          heading: pos.coords.heading ?? null,
          accuracy_m: pos.coords.accuracy ?? null,
          battery_percent: battery,
          is_moving: (pos.coords.speed ?? 0) > 1,
        });
      });
    };

    const tick = () => {
      navigator.geolocation.getCurrentPosition(
        sendPing,
        (err) => console.warn('[useLiveLocation] geo error', err.message),
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
      );
    };

    // First ping immediately, then interval
    tick();
    intervalId.current = window.setInterval(tick, PING_INTERVAL_MS);

    return () => {
      if (intervalId.current) window.clearInterval(intervalId.current);
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      lastPos.current = null;
    };
  }, [enabled, user, activityLogId]);
}
