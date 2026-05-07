import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Coffee, Clock, Gauge, MessageSquare, Mic, MicOff, Send, CheckCircle2, Sparkles, AlertTriangle, Pencil, PackageCheck, ShieldCheck, ChevronRight } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import FatigueBanner from '@/components/FatigueBanner';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import NetworkPattern from '@/components/NetworkPattern';
import { useGeofence, type GeofenceCheck, type StartLocationType } from '@/hooks/useGeofence';
import GeofenceStartDialog from '@/components/GeofenceStartDialog';
import { sendPlatformEvent } from '@/lib/platformSync';
import { useTodayKm } from '@/hooks/useTodayKm';
import { useTodayRoute } from '@/hooks/useTodayRoute';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ActivityLogRow = Tables<'driver_activity_logs'>;

function toTime(value?: string | null) {
  if (!value) return '';
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function minutesBetween(startTime: string, endDate: Date) {
  if (!startTime) return null;
  const [h, m] = startTime.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const start = new Date(endDate);
  start.setHours(h, m, 0, 0);
  return Math.max(0, Math.round((endDate.getTime() - start.getTime()) / 60_000));
}

const WorkTime = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workStarted, setWorkStarted] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [onBreak, setOnBreak] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [activityLog, setActivityLog] = useState<ActivityLogRow | null>(null);

  // KM values are entered once during Pre-Trip (start) and Post-Trip (end)
  // to avoid asking the driver for the same data multiple times.
  const { startKm: preTripStartKm, endKm: postTripEndKm, hasPreTrip, hasPostTrip, refresh: refreshKm } = useTodayKm();
  const { stops, summary: routeSummary } = useTodayRoute();
  const routeEstimatedKm = Math.round(stops.reduce((sum, stop) => sum + Number(stop.raw.estimated_distance_km ?? 0), 0));
  const autoKm = routeEstimatedKm;
  const hasRouteKm = autoKm > 0;

  // End-of-day state
  const [showEndFlow, setShowEndFlow] = useState(false);
  const [dayNote, setDayNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [workEnded, setWorkEnded] = useState(false);

  // Route-estimated km is used only when real odometer values are missing.
  const [displayKm, setDisplayKm] = useState(0);
  const [kmEdited, setKmEdited] = useState(false);
  const [showKmReasonDialog, setShowKmReasonDialog] = useState(false);
  const [kmReason, setKmReason] = useState('');
  const [kmReasonConfirmed, setKmReasonConfirmed] = useState(false);

  // Preloaded vehicle for tomorrow
  const [vehiclePreloaded, setVehiclePreloaded] = useState(false);

  // Geofence
  const { checking, error: geoError, checkStartLocation } = useGeofence();
  const [showGeoDialog, setShowGeoDialog] = useState(false);
  const [geoCheck, setGeoCheck] = useState<GeofenceCheck | null>(null);

  const now = new Date();
  const locale = lang === 'de' ? 'de-DE' : 'en-US';
  const todayIso = now.toISOString().slice(0, 10);

  // Refresh KM values when WorkTime mounts (Pre-Trip may have been just submitted)
  useEffect(() => {
    void refreshKm();
  }, [refreshKm]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadActivityLog = async () => {
      const { data, error } = await supabase
        .from('driver_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', todayIso)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.warn('[WorkTime] activity log unavailable', error.message);
        return;
      }

      const log = data as ActivityLogRow | null;
      setActivityLog(log);
      if (log?.work_start && !log.work_end) {
        setWorkStarted(true);
        setWorkEnded(false);
        setStartTime(toTime(log.work_start));
        setBreakMinutes(log.break_minutes ?? 0);
      } else if (log?.work_end) {
        setWorkStarted(false);
        setWorkEnded(true);
        setBreakMinutes(log.break_minutes ?? 0);
      }
    };

    void loadActivityLog();
    return () => {
      cancelled = true;
    };
  }, [todayIso, user]);

  const saveActivityLog = async (patch: Partial<ActivityLogRow>) => {
    if (!user) return;
    const row = {
      user_id: user.id,
      log_date: todayIso,
      status: 'worked',
      ...patch,
    };
    const { data, error } = await supabase
      .from('driver_activity_logs')
      .upsert(row as never, { onConflict: 'user_id,log_date' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[WorkTime] activity log save failed', error.message);
      return;
    }
    setActivityLog((data as ActivityLogRow | null) ?? activityLog);
  };

  const finalizeStart = async (
    locationType: StartLocationType,
    position: { lat: number; lng: number },
    overrideReason?: string,
  ) => {
    const startedAt = new Date();
    setWorkStarted(true);
    setStartTime(startedAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }));
    sessionStorage.setItem('work_started', 'true');
    void saveActivityLog({
      work_start: startedAt.toISOString(),
      work_end: null,
      break_minutes: 0,
      start_km: preTripStartKm ?? null,
      start_lat: position.lat,
      start_lng: position.lng,
      start_location_type: locationType,
      override_reason: overrideReason ?? null,
      depot_id: geoCheck?.depot?.id ?? null,
    });

    // Fire-and-forget sync to admin platform
    void sendPlatformEvent('work_start', todayIso, {
      start_lat: position.lat,
      start_lng: position.lng,
      start_location_type: locationType,
      override_reason: overrideReason ?? null,
      depot_id: geoCheck?.depot?.id ?? null,
      distance_to_depot_m: geoCheck?.distanceM ?? null,
      started_at: startedAt.toISOString(),
    });

    if (locationType === 'override') {
      void sendPlatformEvent('override', todayIso, {
        reason: overrideReason,
        lat: position.lat,
        lng: position.lng,
      });
      toast.warning(t('geo.emergencyStart'), { description: t('geo.emergencyDesc') });
    }

    setShowGeoDialog(false);
    navigate('/');
  };

  const handleStartWork = async () => {
    // Compliance gate: pre-trip inspection must be completed today
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from('pre_trip_inspections')
          .select('id, blocked_from_driving')
          .eq('user_id', user.id)
          .eq('log_date', todayIso)
          .maybeSingle();
        if (!existing) {
          toast.info('Bitte zuerst Fahrzeug-Check durchführen');
          navigate('/pre-trip-inspection');
          return;
        }
        if (existing.blocked_from_driving) {
          toast.error('Fahrt gesperrt – Mängel müssen behoben werden');
          return;
        }
      }
    } catch (e) {
      console.warn('[pre-trip check] failed, allowing start:', e);
    }

    setShowGeoDialog(true);
    try {
      const check = await checkStartLocation();
      setGeoCheck(check);
    } catch {
      setGeoCheck(null);
    }
  };

  const handleConfirmStartFromDialog = () => {
    if (!geoCheck || !geoCheck.allowed || !geoCheck.locationType) return;
    void finalizeStart(geoCheck.locationType, geoCheck.position);
  };

  const handleOverrideStart = (reason: string) => {
    if (!geoCheck) return;
    void finalizeStart('override', geoCheck.position, reason);
  };

  const handleNavigateToDepot = () => {
    if (!geoCheck?.depot) return;
    const { latitude, longitude } = geoCheck.depot;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
  };

  const handleEndWork = () => {
    // KM driven is computed from Pre-Trip start_km + Post-Trip end_km if available,
    // otherwise from the assigned route distance if that backend field exists.
    const driven = preTripStartKm != null && postTripEndKm != null
      ? postTripEndKm - preTripStartKm
      : autoKm || 0;
    setDisplayKm(driven);

    // If a Post-Trip exists and its driven km deviates from the route auto estimate,
    // ask the driver for a reason on confirm.
    if (postTripEndKm != null && hasRouteKm && Math.abs(driven - autoKm) > 2) {
      setKmEdited(true);
      setKmReasonConfirmed(false);
    } else {
      setKmEdited(false);
    }

    setShowEndFlow(true);
  };

  const finalizeEnd = () => {
    const endedAt = new Date();
    const totalMinutes = minutesBetween(startTime, endedAt);
    setShowEndFlow(false);
    setWorkStarted(false);
    setWorkEnded(true);
    sessionStorage.removeItem('work_started');
    void saveActivityLog({
      work_end: endedAt.toISOString(),
      break_minutes: breakMinutes,
      driven_km: displayKm || null,
      end_km: postTripEndKm ?? null,
      total_work_minutes: totalMinutes,
      vehicle_preloaded_for_next_day: vehiclePreloaded,
      notes: dayNote || null,
    });

    // Sync end-of-day to admin platform
    void sendPlatformEvent('work_end', todayIso, {
      end_time: endedAt.toISOString(),
      driven_km: displayKm,
      auto_km: autoKm,
      km_edited: kmEdited,
      km_reason: kmEdited ? kmReason : null,
      vehicle_preloaded_for_next_day: vehiclePreloaded,
      note: dayNote || null,
    });

    if (kmEdited) {
      void sendPlatformEvent('km_deviation', todayIso, {
        actual_km: displayKm,
        expected_km: autoKm,
        delta_km: displayKm - autoKm,
        reason: kmReason,
      });
    }
  };

  const handleConfirmEnd = () => {
    if (kmEdited && !kmReasonConfirmed) {
      setShowKmReasonDialog(true);
      return;
    }
    finalizeEnd();
  };

  const handleKmReasonSubmit = () => {
    setKmReasonConfirmed(true);
    setShowKmReasonDialog(false);
    finalizeEnd();
  };

  const handleToggleBreak = () => {
    if (onBreak) {
      setBreakMinutes(prev => prev + 30);
    }
    setOnBreak(!onBreak);
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      setDayNote(prev => prev + (prev ? '\n' : '') + '🎙️ ' + t('wt.voiceSaved'));
    }
  };

  const endTime = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const drivenKm = preTripStartKm != null && postTripEndKm != null ? postTripEndKm - preTripStartKm : 0;

  const hour = now.getHours();
  const greeting = hour < 17
    ? t('wt.eveningGreeting')
    : t('wt.nightGreeting');
  const completedVisits = routeSummary?.completedStops ?? 0;
  const totalVisits = routeSummary?.totalStops ?? 0;
  const collectedOil = routeSummary?.collectedOilKg ?? 0;
  const hasRouteStats = Boolean(routeSummary);

  // Parse work start time once for fatigue tracking
  const workStartedAtDate = workStarted && startTime
    ? (() => {
        const [h, m] = startTime.split(':').map(Number);
        const d = new Date();
        d.setHours(h ?? 0, m ?? 0, 0, 0);
        return d;
      })()
    : null;

  return (
    <AppLayout>
      <AppHeader title={t('workTime.title')} showBack />

      <FatigueBanner
        workStartedAt={workStartedAtDate}
        isDriving={workStarted && !onBreak}
        onBreak={onBreak}
        onTakeBreak={() => navigate('/break')}
      />

      <div className="px-4 pt-4 pb-4 space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card"
        >
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
            workStarted
              ? onBreak ? 'bg-warning/10' : 'bg-primary/10'
              : 'bg-muted'
          }`}>
            {workStarted ? (
              onBreak ? <Coffee className="w-8 h-8 text-warning" /> : <Clock className="w-8 h-8 text-primary animate-pulse" />
            ) : (
              <Play className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          {workStarted ? (
            <>
              <p className="text-lg font-bold text-foreground">
                {onBreak ? t('workTime.inBreak') : t('workTime.working')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('workTime.startedAt')} {startTime} · {t('workTime.break')}: {breakMinutes} {t('workTime.min')}
              </p>
            </>
          ) : workEnded ? (
            <>
              <p className="text-lg font-bold text-foreground">{t('wt.dayComplete')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {now.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-foreground">{t('workTime.notStarted')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {now.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 p-4 shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{t('workTime.odometer')}</h3>
            {workStarted && (
              <span className="ml-auto text-[10px] text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                {hasRouteKm ? `~ ${autoKm} ${t('wt.kmEstimated')}` : (lang === 'de' ? 'Route-km nicht verfuegbar' : 'Route km unavailable')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => !hasPreTrip && navigate('/pre-trip-inspection')}
              className={`text-left rounded-xl border p-3 transition-all ${
                hasPreTrip
                  ? 'bg-muted/40 border-border/50 cursor-default'
                  : 'bg-warning/5 border-warning/30 hover:bg-warning/10 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{t('workTime.startKm')}</span>
                {hasPreTrip ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-warning" />
                )}
              </div>
              <p className={`mt-1 text-lg font-bold tabular-nums ${
                hasPreTrip ? 'text-foreground' : 'text-warning'
              }`}>
                {preTripStartKm != null ? `${preTripStartKm.toLocaleString()} km` : (lang === 'de' ? 'Pre-Trip öffnen' : 'Open Pre-Trip')}
              </p>
              {hasPreTrip && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {lang === 'de' ? 'Aus Pre-Trip übernommen' : 'From Pre-Trip inspection'}
                </p>
              )}
            </button>
            <button
              type="button"
              onClick={() => workStarted && !hasPostTrip && navigate('/post-trip')}
              disabled={!workStarted}
              className={`text-left rounded-xl border p-3 transition-all ${
                hasPostTrip
                  ? 'bg-muted/40 border-border/50 cursor-default'
                  : workStarted
                    ? 'bg-primary/5 border-primary/30 hover:bg-primary/10 active:scale-[0.98]'
                    : 'bg-muted/20 border-border/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{t('workTime.endKm')}</span>
                {hasPostTrip ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                ) : workStarted ? (
                  <ChevronRight className="w-3.5 h-3.5 text-primary" />
                ) : null}
              </div>
              <p className={`mt-1 text-lg font-bold tabular-nums ${
                hasPostTrip ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {postTripEndKm != null
                  ? `${postTripEndKm.toLocaleString()} km`
                  : workStarted
                    ? (lang === 'de' ? 'Im Post-Trip' : 'In Post-Trip')
                    : '—'}
              </p>
              {hasPostTrip && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {lang === 'de' ? 'Aus Post-Trip übernommen' : 'From Post-Trip checklist'}
                </p>
              )}
            </button>
          </div>
          {drivenKm > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-primary font-medium">
                {t('workTime.driven')}: {drivenKm} km
              </p>
              {hasRouteKm && Math.abs(drivenKm - autoKm) > 2 && (
                <span className="text-[10px] text-warning font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  (Auto: {autoKm} km)
                </span>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
          {!workStarted && !workEnded ? (
            <Button onClick={handleStartWork} className="w-full h-14 text-base font-semibold bg-gradient-brand hover:opacity-90 rounded-xl">
              <Play className="w-5 h-5 mr-2" /> {t('workTime.start')}
            </Button>
          ) : workStarted ? (
            <>
              <Button onClick={handleToggleBreak} variant="outline" className="w-full h-12 rounded-xl">
                <Coffee className="w-5 h-5 mr-2" /> {onBreak ? t('workTime.endBreak') : t('workTime.startBreak')}
              </Button>
              <Button onClick={handleEndWork} variant="destructive" className="w-full h-12 rounded-xl">
                <Square className="w-5 h-5 mr-2" /> {t('workTime.end')}
              </Button>
            </>
          ) : null}
        </motion.div>
      </div>

      {/* End-of-day flow overlay */}
      <AnimatePresence>
        {showEndFlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowEndFlow(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative overflow-hidden bg-gradient-brand px-5 pt-6 pb-5 text-primary-foreground">
                <NetworkPattern color="rgba(255,255,255,1)" opacity={0.06} animate nodeCount={10} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5" />
                    <h2 className="text-lg font-extrabold">
                      {t('wt.endWorkDay')}
                    </h2>
                  </div>
                  <p className="text-[12px] opacity-80">
                    {`${startTime} – ${endTime} · ${breakMinutes} ${t('wt.minBreak')} · ${displayKm || '—'} km`}
                  </p>
                </div>
              </div>

              {/* Note section */}
              <div className="px-5 py-5 space-y-4">
                {/* Auto km info */}
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-3.5 py-2.5">
                  <Gauge className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      {t('wt.kmAuto')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {kmEdited
                        ? `${t('wt.kmChanged')}: ${displayKm} km (Auto: ${autoKm} km)`
                        : hasRouteKm
                          ? `${autoKm} ${t('wt.kmCalcRoute')}`
                          : (lang === 'de' ? 'Keine Route-km vom Backend verfuegbar' : 'No route km available from backend')
                      }
                    </p>
                  </div>
                  {kmEdited && <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <label className="text-sm font-semibold text-foreground">
                      {t('wt.dailyComment')}
                    </label>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {t('wt.optional')}
                    </span>
                  </div>
                  <textarea
                    value={dayNote}
                    onChange={(e) => setDayNote(e.target.value)}
                    placeholder={t('wt.commentPlaceholder')}
                    className="w-full h-24 bg-muted/50 border border-border/50 rounded-xl px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Voice note button */}
                <button
                  onClick={handleToggleRecording}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                    isRecording
                      ? 'bg-destructive/10 border-destructive/30 text-destructive'
                      : 'bg-muted/40 border-border/50 text-foreground hover:bg-muted/60'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5 text-primary" />
                  )}
                  <span className="text-sm font-medium">
                    {isRecording ? t('wt.stopRecording') : t('wt.recordVoice')}
                  </span>
                  {isRecording && (
                    <div className="ml-auto flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-xs font-mono">REC</span>
                    </div>
                  )}
                </button>

                {/* Vehicle preloaded for tomorrow */}
                <label className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                  vehiclePreloaded
                    ? 'bg-secondary/10 border-secondary/40'
                    : 'bg-muted/40 border-border/50 hover:bg-muted/60'
                }`}>
                  <input
                    type="checkbox"
                    checked={vehiclePreloaded}
                    onChange={(e) => setVehiclePreloaded(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border accent-secondary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-secondary" />
                      <span className="text-sm font-semibold text-foreground">
                        {t('wt.preloadedYes')}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t('wt.preloadedHint')}
                    </p>
                  </div>
                </label>

                {/* Confirm button */}
                <Button
                  onClick={handleConfirmEnd}
                  className="w-full h-13 text-base font-bold bg-gradient-brand hover:opacity-90 rounded-xl"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {t('wt.completeDay')}
                </Button>

                <button
                  onClick={() => setShowEndFlow(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                >
                  {t('wt.cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Km reason dialog */}
      <AnimatePresence>
        {showKmReasonDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowKmReasonDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {t('wt.deviationDetected')}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {`${t('wt.yourValue')}: ${displayKm} km · ${t('wt.calculated')}: ${autoKm} km`}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  {t('wt.deviationReason')}
                </p>

                <textarea
                  value={kmReason}
                  onChange={(e) => setKmReason(e.target.value)}
                  autoFocus
                  placeholder={t('wt.deviationPlaceholder')}
                  className="w-full h-20 bg-muted/50 border border-border/50 rounded-xl px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-warning/30 focus:border-warning/50 transition-all"
                />
              </div>

              <div className="px-5 pb-5 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowKmReasonDialog(false)}
                  className="flex-1 h-11 rounded-xl text-sm"
                >
                  {t('wt.back')}
                </Button>
                <Button
                  onClick={handleKmReasonSubmit}
                  disabled={!kmReason.trim()}
                  className="flex-1 h-11 rounded-xl text-sm bg-gradient-brand hover:opacity-90"
                >
                  {t('wt.confirm')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thank-you screen after ending */}
      <AnimatePresence>
        {workEnded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 -mt-1 space-y-3"
          >
            <div className="relative overflow-hidden bg-gradient-brand rounded-2xl p-6 text-primary-foreground text-center shadow-elevated">
              <NetworkPattern color="rgba(255,255,255,1)" opacity={0.06} animate nodeCount={8} />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                >
                  <CheckCircle2 className="w-14 h-14 mx-auto mb-3 drop-shadow-lg" />
                </motion.div>
                <h3 className="text-xl font-extrabold">{t('wt.thankYou')}</h3>
                <p className="text-sm opacity-80 mt-2">{greeting}</p>
                <p className="text-[11px] opacity-60 mt-3 tracking-wide">
                  {t('wt.dataSubmitted')}
                </p>
              </div>
            </div>

            {/* Daily stats summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl border border-border/50 p-4 shadow-card"
            >
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                {t('wt.dayInNumbers')}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-primary">{completedVisits}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {t('wt.visitsDone')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-secondary">{collectedOil} kg</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {t('wt.oilCollected')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-foreground">{displayKm}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {t('wt.kmDriven')}
                  </p>
                </div>
              </div>

              {/* Predicted vs Actual km comparison */}
              <div className="mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t('wt.predicted')}
                    </span>
                    <span className="font-bold text-foreground">{hasRouteKm ? `${autoKm} km` : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {t('wt.actual')}
                    </span>
                    <span className={`font-bold ${
                      hasRouteKm && Math.abs(displayKm - autoKm) > 2 ? 'text-warning' : 'text-primary'
                    }`}>
                      {displayKm || '—'} km
                    </span>
                  </div>
                  {hasRouteKm && Math.abs(displayKm - autoKm) > 2 && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      displayKm > autoKm ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                    }`}>
                      {displayKm > autoKm ? '+' : ''}{displayKm - autoKm} km
                    </span>
                  )}
                </div>
              </div>
              {kmEdited && kmReason && (
                <div className="mt-3 pt-3 border-t border-border/40 flex items-start gap-2">
                  <Pencil className="w-3 h-3 text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-warning">
                      {t('wt.kmDeviation')}:
                    </span>{' '}
                    {kmReason}
                  </p>
                </div>
              )}
              {!hasRouteStats && (
                <p className="text-[11px] text-muted-foreground text-center mt-3 pt-3 border-t border-border/40">
                  {lang === 'de' ? 'Keine echten Tourdaten fuer diese Tageszusammenfassung verfuegbar.' : 'No real route data is available for this daily summary.'}
                </p>
              )}
              {completedVisits > 0 && (
                <p className="text-[11px] text-primary font-medium text-center mt-3 pt-3 border-t border-border/40">
                  🎯 {`${completedVisits} ${t('wt.visitsCompleted').replace('{total}', String(totalVisits))}`}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GeofenceStartDialog
        open={showGeoDialog}
        checking={checking}
        check={geoCheck}
        errorCode={geoError}
        onClose={() => setShowGeoDialog(false)}
        onConfirmStart={handleConfirmStartFromDialog}
        onOverride={handleOverrideStart}
        onNavigateToDepot={handleNavigateToDepot}
      />
    </AppLayout>
  );
};

export default WorkTime;
