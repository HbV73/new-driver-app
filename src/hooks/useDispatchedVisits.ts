import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type DispatchedVisit = Tables<'dispatched_visits'>;

/**
 * Subscribes to dispatched_visits realtime stream for current driver.
 * Shows toast when a new visit is dispatched.
 */
export function useDispatchedVisits() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<DispatchedVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('dispatched_visits')
      .select('*')
      .eq('driver_user_id', user.id)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false });
    setVisits((data as DispatchedVisit[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void refresh();

    const channel = supabase
      .channel('dispatched-visits-' + user.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispatched_visits',
          filter: `driver_user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const v = payload.new as DispatchedVisit;
            toast.info(`📍 ${v.customer_name}`, {
              description: v.address,
              duration: 8000,
            });
            // Vibrate if available
            if ('vibrate' in navigator) navigator.vibrate?.([200, 100, 200]);
          }
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const accept = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('dispatched_visits')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Besuch angenommen');
  }, []);

  const reject = useCallback(async (id: string, reason: string) => {
    const { error } = await supabase
      .from('dispatched_visits')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Besuch abgelehnt');
  }, []);

  return { visits, loading, accept, reject, refresh };
}
