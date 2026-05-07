import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type DayLock = Tables<'day_locks'>;

/**
 * Watches day_locks for the given date. Returns whether the day is locked by admin.
 */
export function useDayLock(logDate: string) {
  const { user } = useAuth();
  const [lock, setLock] = useState<DayLock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('day_locks')
        .select('*')
        .eq('driver_user_id', user.id)
        .eq('log_date', logDate)
        .maybeSingle();
      if (!cancelled) {
        setLock((data as DayLock) ?? null);
        setLoading(false);
      }
    };
    void load();

    const channel = supabase
      .channel(`day-lock-${user.id}-${logDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'day_locks',
          filter: `driver_user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as DayLock;
          if (row?.log_date === logDate) {
            if (payload.eventType === 'DELETE') setLock(null);
            else {
              setLock(payload.new as DayLock);
              if ((payload.new as DayLock).locked) {
                toast.warning('🔒 Tag wurde vom Admin gesperrt', { duration: 6000 });
              } else {
                toast.success('🔓 Tag wurde entsperrt');
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user, logDate]);

  return {
    lock,
    isLocked: !!lock?.locked,
    loading,
  };
}
