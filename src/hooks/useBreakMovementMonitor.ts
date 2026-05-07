import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MonitorOptions {
  enabled: boolean;
  thresholdMeters: number;
  windowSeconds: number;
  activityLogId?: string | null;
  onAlert: (info: { distance: number; lat: number; lng: number }) => void;
}

// Haversine distance in meters
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

/**
 * Monitors GPS while a driver is on break.
 * If the vehicle moves more than `thresholdMeters` within `windowSeconds`,
 * an alert row is logged + onAlert callback fires.
 *
 * Designed to silently no-op if geolocation is unavailable.
 */
export function useBreakMovementMonitor({
  enabled,
  thresholdMeters,
  windowSeconds,
  activityLogId,
  onAlert,
}: MonitorOptions) {
  const startPosRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const alertedRef = useRef(false);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [currentDistance, setCurrentDistance] = useState(0);

  useEffect(() => {
    if (!enabled) {
      // cleanup
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
      startPosRef.current = null;
      alertedRef.current = false;
      setOrigin(null);
      setCurrentDistance(0);
      return;
    }

    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startPosRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          at: Date.now(),
        };
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // ignore — user may have denied
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const start = startPosRef.current;
        if (!start) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const dist = haversine(start.lat, start.lng, lat, lng);
        setCurrentDistance(dist);

        const elapsedSec = (Date.now() - start.at) / 1000;

        if (
          !alertedRef.current &&
          dist >= thresholdMeters &&
          elapsedSec <= windowSeconds + 60 // small grace window
        ) {
          alertedRef.current = true;
          onAlert({ distance: dist, lat, lng });

          // Persist to DB
          void (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from('break_movement_alerts').insert({
                user_id: user.id,
                activity_log_id: activityLogId ?? null,
                break_start_at: new Date(start.at).toISOString(),
                break_start_lat: start.lat,
                break_start_lng: start.lng,
                detected_lat: lat,
                detected_lng: lng,
                distance_m: dist,
                window_seconds: Math.round(elapsedSec),
              });

              // Audit trail
              await supabase.from('driver_audit_logs').insert({
                user_id: user.id,
                activity_log_id: activityLogId ?? null,
                field_name: 'break_movement_detected',
                old_value: `start ${start.lat.toFixed(5)},${start.lng.toFixed(5)}`,
                new_value: `moved ${dist}m in ${Math.round(elapsedSec)}s`,
                change_reason: 'auto-detected vehicle movement during break',
              });
            } catch (err) {
              console.error('[BreakMonitor] failed to log alert', err);
            }
          })();
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    };
  }, [enabled, thresholdMeters, windowSeconds, activityLogId, onAlert]);

  return { origin, currentDistance };
}
