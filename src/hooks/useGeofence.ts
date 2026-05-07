import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { locationService } from '@/services/device/location';

export interface Depot {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  geofence_radius_m: number;
}

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export type StartLocationType = 'depot' | 'home_preloaded' | 'override';

export interface GeofenceCheck {
  position: GeoPosition;
  depot: Depot | null;
  distanceM: number | null;
  insideDepot: boolean;
  vehiclePreloaded: boolean;
  allowed: boolean;
  locationType: StartLocationType | null;
  reason: string;
}

// Haversine distance in meters
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

async function getCurrentPosition(): Promise<GeoPosition> {
  const location = await locationService.getCurrentLocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  });

  if (!location) {
    throw new Error('POSITION_UNAVAILABLE');
  }

  return {
    lat: location.latitude,
    lng: location.longitude,
    accuracy: location.accuracy ?? 0,
  };
}

export function useGeofence() {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStartLocation = useCallback(async (): Promise<GeofenceCheck> => {
    setChecking(true);
    setError(null);
    try {
      // 1. Get GPS
      const position = await getCurrentPosition();

      // 2. Get nearest active depot for current user's region
      const { data: depots, error: depotErr } = await supabase
        .from('depots')
        .select('*')
        .eq('is_active', true);

      if (depotErr) throw depotErr;

      let depot: Depot | null = null;
      let distanceM: number | null = null;
      if (depots && depots.length > 0) {
        const ranked = depots
          .map((d) => ({
            d: d as Depot,
            dist: haversineM(position.lat, position.lng, d.latitude, d.longitude),
          }))
          .sort((a, b) => a.dist - b.dist);
        depot = ranked[0].d;
        distanceM = ranked[0].dist;
      }

      const insideDepot = depot != null && distanceM != null && distanceM <= depot.geofence_radius_m;

      // 3. Check vehicle_preloaded flag from yesterday's log
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yIso = yesterday.toISOString().slice(0, 10);

      const { data: { user } } = await supabase.auth.getUser();
      let vehiclePreloaded = false;
      if (user) {
        const { data: prevLog } = await supabase
          .from('driver_activity_logs')
          .select('vehicle_preloaded_for_next_day')
          .eq('user_id', user.id)
          .eq('log_date', yIso)
          .maybeSingle();
        vehiclePreloaded = !!prevLog?.vehicle_preloaded_for_next_day;
      }

      let allowed = false;
      let locationType: StartLocationType | null = null;
      let reason = '';

      if (insideDepot) {
        allowed = true;
        locationType = 'depot';
        reason = 'at_depot';
      } else if (vehiclePreloaded) {
        allowed = true;
        locationType = 'home_preloaded';
        reason = 'preloaded';
      } else {
        allowed = false;
        reason = 'not_at_depot_no_preload';
      }

      return {
        position,
        depot,
        distanceM,
        insideDepot,
        vehiclePreloaded,
        allowed,
        locationType,
        reason,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'UNKNOWN';
      setError(msg);
      throw e;
    } finally {
      setChecking(false);
    }
  }, []);

  return { checking, error, checkStartLocation };
}
