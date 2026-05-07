import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type DriverNotification = Tables<'driver_notifications'>;

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<DriverNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    const list = (data as DriverNotification[]) ?? [];
    setItems(list);
    setUnreadCount(list.filter((n) => !n.read).length);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void refresh();

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as DriverNotification;
          toast(n.title, { description: n.body ?? undefined, duration: 6000 });
          if ('vibrate' in navigator) navigator.vibrate?.(150);
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      await supabase
        .from('driver_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      void refresh();
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('driver_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('read', false);
    void refresh();
  }, [user, refresh]);

  return { items, unreadCount, markRead, markAllRead, refresh };
}
