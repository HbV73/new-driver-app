import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Bell, BellOff, ChevronRight, AlertTriangle, TreePine, Clock, Pause, Play, Navigation } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useBreakMovementMonitor } from '@/hooks/useBreakMovementMonitor';
import { sendPlatformEvent } from '@/lib/platformSync';

interface WorkSettings {
  break_duration_minutes: number;
  break_movement_threshold_m: number;
  break_movement_window_seconds: number;
}

const DEFAULT_SETTINGS: WorkSettings = {
  break_duration_minutes: 60,
  break_movement_threshold_m: 100,
  break_movement_window_seconds: 120,
};

const BreakPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<WorkSettings>(DEFAULT_SETTINGS);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [breakCompleted, setBreakCompleted] = useState(false);
  const [movementAlert, setMovementAlert] = useState<{ distance: number; lat: number; lng: number } | null>(null);

  const breakDurationSec = settings.break_duration_minutes * 60;
  const remaining = Math.max(breakDurationSec - elapsed, 0);
  const progress = Math.min(elapsed / breakDurationSec, 1);

  // Load admin-configured settings on mount
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('work_settings')
        .select('break_duration_minutes, break_movement_threshold_m, break_movement_window_seconds')
        .eq('scope', 'global')
        .maybeSingle();
      if (data) setSettings(data as WorkSettings);
    })();
  }, []);

  // GPS movement monitor — active during the break
  const handleMovementAlert = useCallback(
    (info: { distance: number; lat: number; lng: number }) => {
      setMovementAlert(info);
      toast.error(t('break.movementDetected'), {
        description: t('break.movementDesc').replace('{m}', String(info.distance)),
        duration: 12000,
        icon: '🚨',
      });
      void sendPlatformEvent('break_movement', new Date().toISOString().slice(0, 10), {
        distance_m: info.distance,
        detected_lat: info.lat,
        detected_lng: info.lng,
        elapsed_break_seconds: elapsed,
      });
    },
    [elapsed, t]
  );

  const { origin, currentDistance } = useBreakMovementMonitor({
    enabled: !breakCompleted && !paused,
    thresholdMeters: settings.break_movement_threshold_m,
    windowSeconds: settings.break_movement_window_seconds,
    onAlert: handleMovementAlert,
  });



  useEffect(() => {
    if (paused || breakCompleted) return;
    const iv = setInterval(() => {
      setElapsed(s => {
        const next = s + 1;
        if (next >= breakDurationSec) {
          setBreakCompleted(true);
          return breakDurationSec;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [paused, breakCompleted, breakDurationSec]);

  // Reminder notification
  useEffect(() => {
    if (!reminderSet) return;
    if (remaining <= 0 && breakCompleted) {
      toast.success(t('break.completeToast'), {
        duration: 10000,
        icon: '☕',
      });
      setReminderSet(false);
    }
  }, [breakCompleted, reminderSet, remaining]);

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  const handleSetReminder = () => {
    setReminderSet(true);
    toast.info(t('break.reminderSet'), {
      icon: '🔔',
      duration: 3000,
    });
  };

  const handleEndBreakEarly = () => {
    setShowEndConfirm(true);
  };

  const confirmEndBreak = () => {
    setShowEndConfirm(false);
    navigate(-1);
  };

  const handleBreakComplete = () => {
    navigate(-1);
  };

  // Circle progress for the timer
  const circleSize = 220;
  const strokeWidth = 10;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-background to-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('break.title')}</h1>
              <p className="text-xs text-muted-foreground">{settings.break_duration_minutes} {t('workTime.min')} · {t('break.subtitle').replace(/^\d+\s*\w*\s/, '')}</p>
            </div>
          </div>
        </div>

        {/* Main timer */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative"
          >
            <svg width={circleSize} height={circleSize} className="transform -rotate-90">
              {/* Track */}
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
              />
              {/* Progress */}
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                fill="none"
                stroke={breakCompleted ? 'hsl(var(--primary))' : 'hsl(45, 93%, 47%)'}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {breakCompleted ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl mb-1"
                  >
                    ✅
                  </motion.div>
                  <p className="text-sm font-bold text-primary">{t('break.done')}</p>
                </>
              ) : (
                <>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">
                    {paused ? t('break.paused') : t('break.remaining')}
                  </p>
                  <p className="text-4xl font-mono font-extrabold text-foreground tabular-nums tracking-tight">
                    {formatTime(remaining)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatTime(elapsed)} {t('break.elapsed')}
                  </p>
                </>
              )}
            </div>
          </motion.div>

          {/* Progress bar below */}
          <div className="w-full max-w-xs mt-6">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${breakCompleted ? 'bg-primary' : 'bg-amber-500'}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">0 Min</span>
              <span className="text-[10px] text-muted-foreground">{settings.break_duration_minutes} Min</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-8 space-y-3">
          {!breakCompleted ? (
            <>
              {/* Pause/Resume */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPaused(!paused)}
                  className="flex-1 h-12 rounded-2xl text-sm font-semibold"
                >
                  {paused ? (
                    <><Play className="w-4 h-4 mr-1.5" /> {t('break.resume')}</>
                  ) : (
                    <><Pause className="w-4 h-4 mr-1.5" /> {t('break.pause')}</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={reminderSet ? () => { setReminderSet(false); toast.info(t('break.reminderRemoved')); } : handleSetReminder}
                  className={`flex-1 h-12 rounded-2xl text-sm font-semibold ${reminderSet ? 'border-amber-400 bg-amber-50 text-amber-700' : ''}`}
                >
                  {reminderSet ? (
                    <><BellOff className="w-4 h-4 mr-1.5" /> {t('break.reminderOff')}</>
                  ) : (
                    <><Bell className="w-4 h-4 mr-1.5" /> {t('break.remindMe')}</>
                  )}
                </Button>
              </div>

              {/* End break early */}
              <Button
                variant="ghost"
                onClick={handleEndBreakEarly}
                className="w-full h-11 rounded-2xl text-sm text-destructive hover:bg-destructive/5"
              >
                {t('break.endEarly')}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleBreakComplete}
              className="w-full h-14 text-base font-bold bg-gradient-brand hover:opacity-90 rounded-2xl shadow-lg"
            >
              {t('break.continue')}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}

          {/* GPS monitor status */}
          {!breakCompleted && origin && (
            <div className={`rounded-xl px-4 py-3 flex items-center gap-2.5 border ${
              movementAlert
                ? 'bg-destructive/10 border-destructive/30'
                : 'bg-primary/5 border-primary/20'
            }`}>
              <Navigation className={`w-4 h-4 shrink-0 ${movementAlert ? 'text-destructive' : 'text-primary'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-semibold ${movementAlert ? 'text-destructive' : 'text-foreground'}`}>
                  {movementAlert ? t('break.movementBannerTitle') : t('break.monitorActive')}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t('break.distanceFromStart')}: <span className="font-mono font-bold">{currentDistance} m</span>
                  {' · '}
                  <span className="opacity-70">≤ {settings.break_movement_threshold_m} m</span>
                </p>
              </div>
            </div>
          )}

          {/* Info banner */}
          {!breakCompleted && !movementAlert && (
            <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <TreePine className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-foreground font-medium">{t('break.tipTitle')}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {t('break.tipText')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Early end confirmation dialog */}
        <AnimatePresence>
          {showEndConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-6"
              onClick={() => setShowEndConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{t('break.endConfirmTitle')}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t('break.endConfirmSub').replace('{min}', String(Math.floor(elapsed / 60)))}
                    </p>
                  </div>
                </div>

                <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2.5 mb-4">
                  <p className="text-xs text-destructive/80">
                    {t('break.endWarning')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 h-11 rounded-xl"
                  >
                    {t('break.keepResting')}
                  </Button>
                  <Button
                    onClick={confirmEndBreak}
                    className="flex-1 h-11 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {t('break.endAnyway')}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default BreakPage;
