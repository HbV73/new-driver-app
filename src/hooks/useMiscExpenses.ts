import { useCallback, useEffect, useState } from 'react';
import { listMiscExpenses, MiscExpense } from '@/lib/miscExpenses';
import { supabase } from '@/integrations/supabase/client';

export function useMiscExpenses() {
  const [items, setItems] = useState<MiscExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setItems([]); setLoading(false); return; }
    setUserId(user.id);
    const list = await listMiscExpenses(user.id);
    setItems(list);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { items, loading, refresh, userId };
}
