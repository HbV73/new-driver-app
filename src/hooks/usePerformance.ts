import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceRow {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  current_streak_days: number;
  best_streak_days: number;
  total_oil_kg: number;
  total_visits: number;
  on_time_visits: number;
  last_visit_date: string | null;
  badges: string[];
  driver_name?: string;
}

const POINTS_PER_VISIT = 10;
const POINTS_PER_KG = 2;
const POINTS_ON_TIME_BONUS = 5;

function calcLevel(points: number): number {
  // simple curve: lvl = floor(sqrt(points / 100)) + 1
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

export async function awardPointsForVisit(userId: string, opts: {
  oilKg: number;
  onTime: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const earned =
    POINTS_PER_VISIT +
    Math.round((opts.oilKg || 0) * POINTS_PER_KG) +
    (opts.onTime ? POINTS_ON_TIME_BONUS : 0);

  // fetch or create row
  const { data: existing } = await supabase
    .from('driver_performance')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('driver_performance').insert({
      user_id: userId,
      total_points: earned,
      level: calcLevel(earned),
      current_streak_days: 1,
      best_streak_days: 1,
      total_oil_kg: opts.oilKg,
      total_visits: 1,
      on_time_visits: opts.onTime ? 1 : 0,
      last_visit_date: today,
      badges: [],
    });
    return { earned, total: earned };
  }

  const totalPoints = (existing.total_points ?? 0) + earned;
  const last = existing.last_visit_date as string | null;
  let streak = existing.current_streak_days ?? 0;
  if (last === today) {
    // same day, no streak change
  } else if (last) {
    const diff = Math.round((new Date(today).getTime() - new Date(last).getTime()) / 86_400_000);
    streak = diff === 1 ? streak + 1 : 1;
  } else {
    streak = 1;
  }

  await supabase
    .from('driver_performance')
    .update({
      total_points: totalPoints,
      level: calcLevel(totalPoints),
      total_oil_kg: Number(existing.total_oil_kg ?? 0) + opts.oilKg,
      total_visits: (existing.total_visits ?? 0) + 1,
      on_time_visits: (existing.on_time_visits ?? 0) + (opts.onTime ? 1 : 0),
      current_streak_days: streak,
      best_streak_days: Math.max(existing.best_streak_days ?? 0, streak),
      last_visit_date: today,
    })
    .eq('user_id', userId);

  return { earned, total: totalPoints };
}

export function useLeaderboard(limit = 20) {
  const [rows, setRows] = useState<PerformanceRow[]>([]);
  const [me, setMe] = useState<PerformanceRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from('driver_performance')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limit);

    const list = (data ?? []) as PerformanceRow[];

    // attach driver names
    const ids = list.map(r => r.user_id);
    if (ids.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', ids);
      const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
      list.forEach(r => { r.driver_name = nameMap.get(r.user_id) ?? '—'; });
    }

    setRows(list);
    setMe(user ? list.find(r => r.user_id === user.id) ?? null : null);
    setLoading(false);
  }, [limit]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { rows, me, loading, refresh };
}
