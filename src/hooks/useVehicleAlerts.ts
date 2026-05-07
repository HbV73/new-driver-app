import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type VehicleAlert = Database['public']['Tables']['vehicle_service_alerts']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];

/**
 * Loads the driver's assigned vehicle + active service alerts (TÜV, oil, tires...).
 * Auto-skips alerts that are dismissed (within their dismiss window) or resolved.
 */
export function useVehicleAlerts() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [alerts, setAlerts] = useState<VehicleAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: v } = await supabase
        .from('vehicles')
        .select('*')
        .eq('assigned_driver_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      setVehicle(v ?? null);
      if (!v) { setAlerts([]); return; }

      const today = new Date().toISOString().slice(0, 10);
      const { data: a } = await supabase
        .from('vehicle_service_alerts')
        .select('*')
        .eq('vehicle_id', v.id)
        .eq('resolved', false)
        .or(`dismissed_until.is.null,dismissed_until.lt.${today}`)
        .order('severity', { ascending: false });
      setAlerts(a ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const dismiss = async (id: string, days = 7) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    await supabase
      .from('vehicle_service_alerts')
      .update({ dismissed_until: until.toISOString().slice(0, 10) })
      .eq('id', id);
    await load();
  };

  return { vehicle, alerts, loading, reload: load, dismiss };
}
