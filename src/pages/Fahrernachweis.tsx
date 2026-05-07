import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Calendar, Eye, ChevronRight, Clock, Settings } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import NetworkPattern from '@/components/NetworkPattern';
import FahrernachweisToday from '@/components/fahrernachweis/TodayView';
import Fahrernachweis28Days from '@/components/fahrernachweis/Last28Days';
import FahrernachweisDetail from '@/components/fahrernachweis/DailyDetail';
import InspectionMode from '@/components/fahrernachweis/InspectionMode';
import WorkRulesSettings from '@/components/fahrernachweis/WorkRulesSettings';
import { getOfflineLogs, type DayLog, type DayStatus } from '@/data/fahrernachweisData';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverApi, type FahrernachweisDayLog } from '@/services/driverApi';

function toDayLog(log: FahrernachweisDayLog): DayLog {
  return {
    date: log.date,
    status: (log.status === 'completed' ? 'worked' : log.status || 'worked') as DayStatus,
    workStart: log.workStart?.slice(0, 5) ?? undefined,
    workEnd: log.workEnd?.slice(0, 5) ?? undefined,
    totalWorkMinutes: log.totalWorkMinutes ?? 0,
    driveMinutes: log.driveMinutes ?? 0,
    breakMinutes: log.breakMinutes ?? 0,
    warehouseMinutes: 0,
    drivenKm: Number(log.drivenKm ?? 0),
    visits: [],
    notes: log.notes ?? undefined,
  };
}

const Fahrernachweis = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [view, setView] = useState<'home' | 'today' | '28days' | 'detail' | 'inspection' | 'settings'>('home');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getDriverApi().getFahrernachweis({ driverUserId: user.id });
      setLogs(data.map(toDayLog));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [user]);

  const todayLog = logs[0] ?? {
    date: new Date().toISOString().slice(0, 10),
    status: 'worked' as DayStatus,
    totalWorkMinutes: 0,
    driveMinutes: 0,
    breakMinutes: 0,
    warehouseMinutes: 0,
    drivenKm: 0,
    visits: [],
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setView('detail');
  };

  const selectedLog = logs.find(l => l.date === selectedDate) || todayLog;

  // Check offline cache availability
  const offlineCache = getOfflineLogs();
  const isOfflineReady = !!offlineCache;

  if (view === 'inspection') {
    return <InspectionMode logs={logs} onClose={() => setView('home')} />;
  }

  if (view === 'today') {
    return <FahrernachweisToday log={todayLog} onBack={() => setView('home')} />;
  }

  if (view === '28days') {
    return <Fahrernachweis28Days logs={logs} onBack={() => setView('home')} onDayClick={handleDayClick} />;
  }

  if (view === 'detail' && selectedDate) {
    return <FahrernachweisDetail log={selectedLog} onBack={() => setView('28days')} />;
  }

  if (view === 'settings') {
    return <WorkRulesSettings onBack={() => setView('home')} />;
  }

  return (
    <AppLayout>
      <AppHeader title={t('fn.title')} showBack />
      <div className="px-4 pt-4 pb-4 space-y-4">
        {(loading || error || logs.length === 0) && (
          <div className="bg-card rounded-2xl border border-border/50 p-4 text-center">
            {loading && <p className="text-sm font-bold text-foreground">Fahrernachweis wird geladen</p>}
            {error && (
              <>
                <p className="text-sm font-bold text-destructive">Fahrernachweis konnte nicht geladen werden</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <button onClick={() => void refresh()} className="mt-3 text-xs font-semibold text-primary">Erneut versuchen</button>
              </>
            )}
            {!loading && !error && logs.length === 0 && (
              <>
                <p className="text-sm font-bold text-foreground">Noch keine echten Fahrernachweise</p>
                <p className="text-xs text-muted-foreground mt-1">Arbeitszeitprotokolle erscheinen hier, sobald driver_activity_logs vorhanden sind.</p>
              </>
            )}
          </div>
        )}

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-gradient-brand rounded-2xl p-5 text-primary-foreground shadow-elevated"
        >
          <NetworkPattern color="rgba(255,255,255,1)" opacity={0.06} animate nodeCount={8} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6" />
              <h2 className="text-lg font-extrabold">{t('fn.title')}</h2>
            </div>
            <p className="text-xs opacity-80">{t('fn.subtitle')}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[11px] font-medium opacity-90">{t('fn.compliant')}</span>
              </div>
              {isOfflineReady && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-medium">
                  {lang === 'de' ? '📱 Offline bereit' : '📱 Offline ready'}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="space-y-2">
          {[
            { key: 'today', icon: Clock, label: t('fn.todayView'), desc: t('fn.todayViewSub'), color: 'bg-primary/10 text-primary' },
            { key: '28days', icon: Calendar, label: t('fn.last28'), desc: t('fn.last28Sub'), color: 'bg-secondary/10 text-secondary' },
            { key: 'inspection', icon: Eye, label: t('fn.inspection'), desc: t('fn.inspectionSub'), color: 'bg-destructive/10 text-destructive' },
            { key: 'settings', icon: Settings, label: lang === 'de' ? 'Arbeitsregeln' : 'Work Rules', desc: lang === 'de' ? 'Zeiten & Grenzwerte konfigurieren' : 'Configure times & limits', color: 'bg-muted text-muted-foreground' },
          ].map((item, i) => (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => setView(item.key as any)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-card rounded-2xl border border-border/50 hover:bg-muted/40 active:bg-muted/60 transition-all shadow-card text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </motion.button>
          ))}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border/50 p-4 shadow-card"
        >
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            {t('fn.quickStats')}
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-primary">{logs.length}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('fn.daysLogged')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-secondary">0</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('fn.gaps')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-success">✓</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('fn.compliantShort')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Fahrernachweis;
