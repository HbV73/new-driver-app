import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { supabase } from '@/integrations/supabase/client';

/**
 * Mounts inside protected app shell. Activates GPS streaming when the driver
 * has an active workday (driver_activity_logs with no work_end for today).
 */
export default function LiveSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeLogId, setActiveLogId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setActiveLogId(null);
      return;
    }
    const today = new Date().toISOString().split('T')[0];

    const checkActive = async () => {
      const { data } = await supabase
        .from('driver_activity_logs')
        .select('id, work_end')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();
      setActiveLogId(data && !data.work_end ? data.id : null);
    };

    void checkActive();
    // re-check every 60s in case work_start/end changes from another tab
    const id = window.setInterval(checkActive, 60_000);

    // also listen to session storage signal
    const onFocus = () => void checkActive();
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  useLiveLocation(!!activeLogId, activeLogId);

  return <>{children}</>;
}
