import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Droplets, Package, SlidersHorizontal, Flame, Trophy, Eye, Play, Wind, ChevronDown, RefreshCw } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';

import SwipeableVisitCard from '@/components/SwipeableVisitCard';
import SafetyNotification from '@/components/SafetyNotification';
import DepotTaskCard from '@/components/DepotTaskCard';
import ScheduleAlert from '@/components/ScheduleAlert';
import VehicleAlertsCard from '@/components/VehicleAlertsCard';
import DispatchedVisitInbox from '@/components/DispatchedVisitInbox';
import DayLockBanner from '@/components/DayLockBanner';
import BackupRequestDialog from '@/components/BackupRequestDialog';
import { CheckCircle2, LifeBuoy } from 'lucide-react';
import { useBackupRequests } from '@/hooks/useBackupRequests';

import ProgressRing from '@/components/ProgressRing';
import { Visit } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import MorningPopup from '@/components/MorningPopup';
import { useTodayRoute } from '@/hooks/useTodayRoute';

const weatherForecast = [
  { time: '08:00', temp: 8, icon: '⛅', wind: 12 },
  { time: '10:00', temp: 11, icon: '☀️', wind: 8 },
  { time: '12:00', temp: 14, icon: '☀️', wind: 10 },
  { time: '14:00', temp: 12, icon: '🌧️', wind: 22 },
  { time: '16:00', temp: 10, icon: '🌧️', wind: 18 },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { openCount: openBackupCount } = useBackupRequests();
  const { routeData, stops, summary, dailySummary, loading, error, isEmpty, refresh } = useTodayRoute();
  const visits: Visit[] = stops.map((stop) => stop.uiVisit);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [showMorningPopup, setShowMorningPopup] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [workStarted, setWorkStarted] = useState(() => {
    return sessionStorage.getItem('work_started') === 'true';
  });

  // Re-check sessionStorage when component mounts or window gets focus
  useEffect(() => {
    const checkWork = () => {
      const val = sessionStorage.getItem('work_started') === 'true';
      setWorkStarted(val);
    };
    window.addEventListener('focus', checkWork);
    const timer = setTimeout(checkWork, 50);
    return () => {
      window.removeEventListener('focus', checkWork);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const key = `morning_popup_${new Date().toISOString().split('T')[0]}`;
    if (!sessionStorage.getItem(key) && routeData && visits.length > 0) {
      setShowMorningPopup(true);
      sessionStorage.setItem(key, 'shown');
    }
  }, [routeData, visits.length]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
  const currentWeather = weatherForecast[0];


  const filteredVisits = visits.filter(v => {
    if (filter === 'pending') return v.status === 'pending' || v.status === 'in_progress';
    if (filter === 'completed') return v.status === 'completed' || v.status === 'skipped';
    return true;
  });

  const progress = summary ? summary.progressPercent / 100 : 0;
  const completedVisits = summary?.completedStops ?? 0;
  const totalVisits = summary?.totalStops ?? 0;
  const estimatedEndTime = dailySummary?.estimatedEndTime ?? '—';
  const estimatedOilKg = dailySummary?.estimatedOilKg ?? 0;
  const totalContainers = dailySummary?.totalContainers ?? 0;

  return (
    <AppLayout>
      <AppHeader
        title={t('myTour')}
        showMenu
        rightContent={
          <div className="flex items-center gap-2.5">
            {/* Weather button */}
            <button
              onClick={() => setShowWeather(!showWeather)}
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1 hover:bg-white/15 transition-colors"
            >
              <span className="text-base leading-none">{currentWeather.icon}</span>
              <span className="text-xs font-bold text-primary-foreground">{currentWeather.temp}°</span>
              <ChevronDown className={`w-3 h-3 text-primary-foreground/60 transition-transform ${showWeather ? 'rotate-180' : ''}`} />
            </button>

            {/* Digital clock */}
            <div className="text-right">
              <div className="text-lg font-black tracking-tight font-mono leading-none text-primary-foreground">{timeStr}</div>
              <div className="text-[9px] opacity-60 tracking-wide uppercase">{dateStr}</div>
            </div>

            <ProgressRing progress={progress} size={44} strokeWidth={3} trackColor="rgba(255,255,255,0.2)" progressColor="white">
              <div className="text-center">
                <div className="text-[12px] font-bold leading-none">{completedVisits}/{totalVisits}</div>
              </div>
            </ProgressRing>
          </div>
        }
      />

      {/* Expandable weather forecast strip */}
      <AnimatePresence>
        {showWeather && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-gradient-brand -mt-px"
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5">
                {weatherForecast.map((w, i) => (
                  <div key={i} className="text-center flex-1">
                    <p className="text-[9px] text-primary-foreground/60">{w.time}</p>
                    <p className="text-base leading-tight mt-0.5">{w.icon}</p>
                    <p className="text-[11px] font-bold text-primary-foreground mt-0.5">{w.temp}°</p>
                    <p className="text-[8px] text-primary-foreground/50 flex items-center justify-center gap-0.5 mt-0.5">
                      <Wind className="w-2 h-2" />{w.wind}
                    </p>
                  </div>
                ))}
              </div>
              {weatherForecast.some(w => w.icon === '🌧️') && (
                <div className="flex items-center gap-1.5 mt-2 justify-center">
                  <Droplets className="w-3 h-3 text-primary-foreground/70" />
                  <span className="text-[10px] font-semibold text-primary-foreground/80">{t('rainAt')}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day lock banner & dispatched visit inbox (admin sync) */}
      <div className="px-4 mt-3 relative z-10">
        <DayLockBanner logDate={new Date().toISOString().split('T')[0]} />
        <DispatchedVisitInbox />
      </div>

      {/* Quick actions: backup request + end-of-shift */}
      <div className="px-4 mt-3 relative z-10 grid grid-cols-2 gap-2">
        <BackupRequestDialog
          trigger={
            <button className="relative flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 active:scale-[0.98] transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <LifeBuoy className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[12px] font-bold text-foreground">{t('backup.request')}</p>
                <p className="text-[10px] text-muted-foreground">
                  {openBackupCount > 0 ? `${openBackupCount} ${t('backup.openCount').toLowerCase()}` : t('backup.urg.normal')}
                </p>
              </div>
              {openBackupCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          }
        />
        <button
          onClick={() => navigate('/post-trip')}
          className="flex items-center gap-2 p-3 rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/15 active:scale-[0.98] transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[12px] font-bold text-foreground">{t('postTrip.menuLabel')}</p>
            <p className="text-[10px] text-muted-foreground">{t('postTrip.title')}</p>
          </div>
        </button>
      </div>

      {/* Work not started banner */}
      {!workStarted && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 relative z-10"
        >
          <button
            onClick={() => navigate('/work-time')}
            className="w-full flex items-center gap-3 p-3.5 bg-warning/10 border border-warning/30 rounded-2xl hover:bg-warning/15 active:scale-[0.98] transition-all duration-200"
          >
            <div className="w-11 h-11 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 text-warning fill-warning" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-bold text-foreground">{t('workBanner.title')}</p>
              <p className="text-[11px] text-muted-foreground">{t('workBanner.subtitle')}</p>
            </div>
            <span className="text-[11px] font-bold text-warning bg-warning/15 px-3 py-1.5 rounded-full shrink-0">
              {t('workBanner.button')}
            </span>
          </button>
        </motion.div>
      )}

      {/* Stats card */}
      <div className="px-4 mt-3 relative z-10 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-card rounded-2xl border border-border/40 shadow-elevated overflow-hidden"
        >
          {/* Top row: badges & stats */}
          <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-secondary/10 text-secondary px-2.5 py-1 rounded-lg">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[12px] font-bold">{summary?.pendingStops ?? 0}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-primary/8 text-primary px-2.5 py-1 rounded-lg">
                <Trophy className="w-3.5 h-3.5" />
                <span className="text-[12px] font-bold">{routeData?.route.route_code ?? '—'}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground ml-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">bis {estimatedEndTime}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-primary" />
                <span className="text-[12px] font-bold text-foreground">{estimatedOilKg} kg</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-secondary" />
                <span className="text-[12px] font-bold text-foreground">{totalContainers}</span>
              </div>
            </div>
          </div>

          {/* XP bar */}
          <div className="px-4 pb-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground font-semibold tracking-wide">Route - {completedVisits}/{totalVisits}</span>
              <span className="text-[10px] text-muted-foreground">{summary?.progressPercent ?? 0}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-brand rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${summary?.progressPercent ?? 0}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      <SafetyNotification maxPerDay={2} />

      {/* Schedule delay alerts */}
      <ScheduleAlert visits={visits} />

      {/* Vehicle service alerts (TÜV, oil, tires...) */}
      <div className="px-4 pb-2">
        <VehicleAlertsCard />
      </div>
      {/* Tracking indicator */}
      <div className="px-4 pb-2 flex items-center gap-2">
        <button
          onClick={() => {
            toast.info(t('gps.toastTitle'), {
              description: t('gps.toastDesc'),
              duration: 6000,
            });
          }}
          className="flex items-center gap-1.5 bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-primary/10 transition-colors active:scale-[0.97]"
        >
          <Eye className="w-3 h-3 text-primary" />
          <span className="text-[9px] font-semibold text-primary">{t('gps.active')}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </button>
      </div>

      {(loading || error || isEmpty) && (
        <div className="px-4 pt-2 pb-1.5">
          <div className="bg-card border border-border/50 rounded-2xl px-4 py-5 text-center shadow-card">
            {loading && (
              <>
                <p className="text-sm font-bold text-foreground">Tour wird geladen</p>
                <p className="text-xs text-muted-foreground mt-1">Die heutige Route wird aus Supabase geladen.</p>
              </>
            )}
            {error && (
              <>
                <p className="text-sm font-bold text-destructive">Tour konnte nicht geladen werden</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <button onClick={() => void refresh()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Erneut versuchen
                </button>
              </>
            )}
            {isEmpty && (
              <>
                <p className="text-sm font-bold text-foreground">Keine Tour für heute</p>
                <p className="text-xs text-muted-foreground mt-1">Sobald die Disposition eine Route zuweist, erscheint sie hier.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="px-4 pt-2 pb-1.5">
        <div className="flex items-center gap-2">
          {[
            { key: 'pending' as const, label: t('open'), count: visits.filter(v => v.status === 'pending' || v.status === 'in_progress').length },
            { key: 'completed' as const, label: t('done'), count: visits.filter(v => v.status === 'completed' || v.status === 'skipped').length },
            { key: 'all' as const, label: t('all'), count: visits.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-[13px] font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                filter === tab.key
                  ? 'bg-primary text-primary-foreground shadow-brand'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[11px] ${filter === tab.key ? 'opacity-80' : 'opacity-50'}`}>
                {tab.count}
              </span>
            </button>
          ))}
          <div className="flex-1" />
          <button
            disabled
            title="Filteroptionen sind noch nicht verbunden"
            className="p-2.5 rounded-xl text-muted-foreground/40 cursor-not-allowed"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Visit list */}
      <div className="px-4 pt-1.5 pb-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredVisits.map((visit, i) => {
            const depotBeforeOrder = 3;
            const depotIndex = filteredVisits.findIndex(v => v.order >= depotBeforeOrder);
            const isDepotSpot = i === depotIndex && filter !== 'completed';

            return (
              <>
                {isDepotSpot && (
                  <motion.div
                    key="depot-task"
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <DepotTaskCard
                      order={visit.order}
                      scheduledTime="09:45"
                    />
                  </motion.div>
                )}
                <motion.div
                  key={visit.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: (i + (isDepotSpot ? 1 : 0)) * 0.04 }}
                >
                  <SwipeableVisitCard
                    visit={visit}
                  />
                </motion.div>
              </>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="h-4" />

      {showMorningPopup && <MorningPopup onClose={() => setShowMorningPopup(false)} />}
    </AppLayout>
  );
};

export default Dashboard;
