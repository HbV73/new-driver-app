import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPlatformEvent } from '@/lib/platformSync';
import { syncOrQueue } from '@/lib/offlineQueue';

/**
 * EU Reg 561/2006: max 4.5h continuous driving, then mandatory 45-min break.
 * - Pre-warning at 4 hours (15-min countdown)
 * - Hard alert at 4.5 hours
 * - Reset only if break >= 45 min taken
 */
const PRE_WARN_MIN = 4 * 60;       // 240
const HARD_LIMIT_MIN = 4.5 * 60;   // 270
const REQUIRED_BREAK_MIN = 45;

export type FatigueLevel = 'ok' | 'pre_warn' | 'hard';

interface State {
  level: FatigueLevel;
  continuousMin: number;
  minutesUntilBreak: number;
}

export function useFatigueMonitor(opts: {
  isDriving: boolean;
  onBreak: boolean;
  workStartedAt: Date | null;
  breakStartedAt?: Date | null;
  activityLogId?: string | null;
}) {
  const { isDriving, onBreak, workStartedAt, breakStartedAt, activityLogId } = opts;
  const [state, setState] = useState<State>({ level: 'ok', continuousMin: 0, minutesUntilBreak: HARD_LIMIT_MIN });
  const lastResetRef = useRef<Date | null>(workStartedAt);
  const breakStartRef = useRef<Date | null>(null);
  const alertedHardRef = useRef(false);

  // track break duration to know if it qualifies as a real reset
  useEffect(() => {
    if (onBreak && !breakStartRef.current) {
      breakStartRef.current = breakStartedAt ?? new Date();
    } else if (!onBreak && breakStartRef.current) {
      const breakMin = (Date.now() - breakStartRef.current.getTime()) / 60000;
      if (breakMin >= REQUIRED_BREAK_MIN) {
        lastResetRef.current = new Date();
        alertedHardRef.current = false;
      }
      breakStartRef.current = null;
    }
  }, [onBreak, breakStartedAt]);

  useEffect(() => {
    if (!isDriving || !workStartedAt) {
      setState({ level: 'ok', continuousMin: 0, minutesUntilBreak: HARD_LIMIT_MIN });
      return;
    }
    const tick = async () => {
      const ref = lastResetRef.current ?? workStartedAt;
      const cont = (Date.now() - ref.getTime()) / 60000;
      let level: FatigueLevel = 'ok';
      if (cont >= HARD_LIMIT_MIN) level = 'hard';
      else if (cont >= PRE_WARN_MIN) level = 'pre_warn';

      setState({
        level,
        continuousMin: Math.floor(cont),
        minutesUntilBreak: Math.max(0, Math.ceil(HARD_LIMIT_MIN - cont)),
      });

      // Fire alert once when crossing hard limit
      if (level === 'hard' && !alertedHardRef.current) {
        alertedHardRef.current = true;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await syncOrQueue(user.id, 'insert', 'fatigue_events', {
              user_id: user.id,
              activity_log_id: activityLogId ?? null,
              continuous_drive_minutes: Math.floor(cont),
              alert_shown_at: new Date().toISOString(),
            });
            void sendPlatformEvent('override', new Date().toISOString().slice(0, 10), {
              type: 'fatigue_hard_limit',
              continuous_minutes: Math.floor(cont),
            });
          }
        } catch (e) {
          console.warn('[fatigue] failed to log:', e);
        }
      }
    };
    void tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [isDriving, workStartedAt, activityLogId]);

  return state;
}
