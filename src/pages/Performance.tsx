import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Droplets, Target, Flame, Award, Calendar, ChevronDown,
  ArrowUp, ArrowDown, Clock, Briefcase, LogIn, Timer, CheckCircle2,
  XCircle, BarChart3, Smartphone, Eye, MapPin, Gauge, Coffee,
  AlertTriangle, Navigation
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { LeaderboardCard } from '@/components/LeaderboardCard';
import ProgressRing from '@/components/ProgressRing';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverApi, type DriverPerformanceData } from '@/services/driverApi';
import type { DriverStats } from '@/types';

type Period = 'week' | 'month' | 'year';
type ReportTab = 'overview' | 'work' | 'visits' | 'activity';

const periodCompare: Record<Period, { oilChange: number; visitChange: number }> = {
  week: { oilChange: 0, visitChange: 0 },
  month: { oilChange: 0, visitChange: 0 },
  year: { oilChange: 0, visitChange: 0 },
};

const emptyPeriodData: Record<Period, { labels: string[]; oilKg: number[]; visits: number[] }> = {
  week: { labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], oilKg: [0, 0, 0, 0, 0, 0, 0], visits: [0, 0, 0, 0, 0, 0, 0] },
  month: { labels: ['W1', 'W2', 'W3', 'W4'], oilKg: [0, 0, 0, 0], visits: [0, 0, 0, 0] },
  year: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'], oilKg: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], visits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
};

const emptyStats: DriverStats = {
  totalOilCollectedKg: 0,
  totalVisitsCompleted: 0,
  currentStreak: 0,
  bestStreak: 0,
  badges: [],
  weeklyData: [],
  rank: 0,
  totalDrivers: 0,
  points: 0,
  level: 1,
  levelProgress: 0,
};

const Performance = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<DriverPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stats = performanceData?.stats ?? emptyStats;
  const [period, setPeriod] = useState<Period>('week');
  const [showHistory, setShowHistory] = useState(false);
  const [reportTab, setReportTab] = useState<ReportTab>('overview');

  const refresh = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setPerformanceData(await getDriverApi().getDriverPerformance({ driverUserId: user.id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPerformanceData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [user]);

  const periodLabels: Record<Period, string> = {
    week: t('perf.thisWeek'),
    month: t('perf.thisMonth'),
    year: t('perf.thisYear'),
  };

  const data = performanceData?.periodData[period] ?? emptyPeriodData[period];
  const maxOil = Math.max(...data.oilKg);
  const totalOil = data.oilKg.reduce((a, b) => a + b, 0);
  const totalVisits = data.visits.reduce((a, b) => a + b, 0);
  const avgOil = Math.round(totalOil / data.labels.filter((_, i) => data.oilKg[i] > 0).length || 1);
  const compare = periodCompare[period];
  const history: Array<{ period: string; oil: number; visits: number; avg: number }> = [];

  // Leave history
  const [showLeave, setShowLeave] = useState(false);
  const leaveHistory: Array<{ date: string; type: 'vacation' | 'sick' | 'hourly'; label: string; status: 'approved' | 'rejected' | 'pending' }> = [];
  const leaveTypeLabel = { vacation: 'Urlaub', sick: 'Krank', hourly: 'Stundenweise' };
  const leaveStatusStyle = {
    approved: 'bg-primary/10 text-primary',
    rejected: 'bg-destructive/10 text-destructive',
    pending: 'bg-warning/10 text-warning',
  };

  // Work report states
  const [showWorkLog, setShowWorkLog] = useState(false);
  const [showLoginLog, setShowLoginLog] = useState(false);
  const [showVisitSuccess, setShowVisitSuccess] = useState(false);

  // Calculate totals for current period work log
  const workLogs = performanceData?.workLogs ?? [];
  const weekTotalRegular = workLogs.reduce((s, d) => s + d.regularH, 0);
  const weekTotalOvertime = workLogs.reduce((s, d) => s + d.overtimeH, 0);
  const weekTotalKm = workLogs.reduce((s, d) => s + d.km, 0);

  return (
    <AppLayout>
      <AppHeader title={t('perf.title')} showBack />

      <div className="px-4 pt-5 space-y-5">
        {(loading || error || !performanceData?.stats) && (
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            {loading && <p className="text-sm font-bold text-foreground">Leistung wird geladen</p>}
            {error && (
              <>
                <p className="text-sm font-bold text-destructive">Leistung konnte nicht geladen werden</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <button onClick={() => void refresh()} className="mt-3 text-xs font-semibold text-primary">Erneut versuchen</button>
              </>
            )}
            {!loading && !error && !performanceData?.stats && (
              <>
                <p className="text-sm font-bold text-foreground">Noch keine Leistungsdaten</p>
                <p className="text-xs text-muted-foreground mt-1">Echte Fahrerstatistiken erscheinen hier, sobald Backend-Daten vorhanden sind.</p>
              </>
            )}
          </div>
        )}

        {/* Hero stat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-brand rounded-2xl p-5 text-primary-foreground"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">{t('perf.totalCollected')}</p>
              <p className="text-3xl font-bold mt-1">{stats.totalOilCollectedKg.toLocaleString()} kg</p>
              <p className="text-xs opacity-80 mt-1">{stats.totalVisitsCompleted} {t('perf.visitsCompleted')}</p>
            </div>
            <div className="text-right">
              <div className="w-14 h-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ranking + streak */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <StatBox icon={Award} value={`#${stats.rank}`} label={t('perf.ranking')} sub={`${t('perf.of')} ${stats.totalDrivers}`} />
          <StatBox icon={Flame} value={`${stats.currentStreak}`} label={t('perf.streak')} sub={`${t('perf.best')}: ${stats.bestStreak}`} />
          <StatBox icon={Target} value={`${stats.points}`} label={t('perf.points')} sub={`${t('perf.level')} ${stats.level}`} />
        </motion.div>

        {/* Report tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl"
        >
          {([
            { key: 'overview' as ReportTab, label: t('perf.overview'), icon: BarChart3 },
            { key: 'work' as ReportTab, label: t('perf.workTime'), icon: Timer },
            { key: 'visits' as ReportTab, label: t('perf.successRate'), icon: CheckCircle2 },
            { key: 'activity' as ReportTab, label: t('perf.activity'), icon: Eye },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setReportTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 rounded-lg transition-all ${
                reportTab === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* =================== OVERVIEW TAB =================== */}
        {reportTab === 'overview' && (
          <>
            {/* Period selector */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2"
            >
              {(['week', 'month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
                    period === p
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {p === 'week' ? t('perf.week') : p === 'month' ? t('perf.month') : t('perf.year')}
                </button>
              ))}
            </motion.div>

            {/* Summary cards */}
            <motion.div key={period} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2.5">
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <Droplets className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-base font-extrabold text-foreground">{totalOil.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">{t('perf.oilKg')}</p>
                <div className={`flex items-center justify-center gap-0.5 mt-1 text-[9px] font-medium ${compare.oilChange >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {compare.oilChange >= 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                  {Math.abs(compare.oilChange)}%
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <Target className="w-4 h-4 text-secondary mx-auto mb-1" />
                <p className="text-base font-extrabold text-foreground">{totalVisits}</p>
                <p className="text-[9px] text-muted-foreground">{t('visits')}</p>
                <div className={`flex items-center justify-center gap-0.5 mt-1 text-[9px] font-medium ${compare.visitChange >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {compare.visitChange >= 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                  {Math.abs(compare.visitChange)}%
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-base font-extrabold text-foreground">{avgOil}</p>
                <p className="text-[9px] text-muted-foreground">{period === 'year' ? t('perf.avgPerMonth') : t('perf.avgPerDay')}</p>
              </div>
            </motion.div>

            {/* Chart */}
            <motion.div key={`chart-${period}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">{periodLabels[period]} (kg Oel)</h3>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-32">
                {data.labels.map((label, i) => (
                  <div key={label} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[9px] text-muted-foreground font-medium">{data.oilKg[i] > 0 ? data.oilKg[i] : ''}</span>
                    <motion.div
                      className="w-full rounded-lg bg-primary/80"
                      initial={{ height: 0 }}
                      animate={{ height: maxOil > 0 ? `${(data.oilKg[i] / maxOil) * 100}%` : 0 }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                      style={{ minHeight: data.oilKg[i] > 0 ? 6 : 2 }}
                    />
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground mb-2">{t('visits')}</p>
                <div className="flex items-end justify-between gap-1.5 h-16">
                  {data.labels.map((label, i) => {
                    const maxV = Math.max(...data.visits);
                    return (
                      <div key={`v-${label}`} className="flex flex-col items-center gap-0.5 flex-1">
                        <span className="text-[8px] text-muted-foreground">{data.visits[i] > 0 ? data.visits[i] : ''}</span>
                        <motion.div
                          className="w-full rounded-md bg-secondary/60"
                          initial={{ height: 0 }}
                          animate={{ height: maxV > 0 ? `${(data.visits[i] / maxV) * 100}%` : 0 }}
                          transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                          style={{ minHeight: data.visits[i] > 0 ? 4 : 2 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* History toggle */}
            <CollapsibleSection
              icon={Calendar}
              iconColor="text-primary"
              title={t('perf.showHistory')}
              open={showHistory}
              onToggle={() => setShowHistory(!showHistory)}
            >
              {history.map((h, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-foreground">{h.period}</p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-primary" /><strong className="text-foreground">{h.oil}</strong> kg
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Target className="w-3 h-3 text-secondary" /><strong className="text-foreground">{h.visits}</strong> {t('visits')}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Durchschnitt {h.avg} kg/Tag</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min((h.oil / 1000) * 100, 100)}%` }} />
                  </div>
                </motion.div>
              ))}
            </CollapsibleSection>

            {/* Leave History */}
            <CollapsibleSection
              icon={Briefcase}
              iconColor="text-secondary"
              title={t('perf.absences')}
              open={showLeave}
              onToggle={() => setShowLeave(!showLeave)}
            >
              {leaveHistory.map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{leaveTypeLabel[l.type]}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{l.label} - {l.date}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${leaveStatusStyle[l.status]}`}>
                    {l.status === 'approved' ? 'Genehmigt' : l.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                  </span>
                </motion.div>
              ))}
            </CollapsibleSection>

            {/* Badges */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('perf.badges')}</h3>
              <div className="grid grid-cols-3 gap-3">
                {stats.badges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className={`bg-card border rounded-2xl p-3 text-center transition-all ${
                      badge.earned ? 'border-primary/30 shadow-sm' : 'border-border opacity-40 grayscale'
                    }`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <p className="text-[10px] font-semibold text-foreground mt-1.5 leading-tight">{badge.name}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{badge.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* =================== WORK TIME TAB =================== */}
        {reportTab === 'work' && (
          <>
            {/* Weekly summary cards */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2.5">
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-base font-extrabold text-foreground">{weekTotalRegular.toFixed(1)}</p>
                <p className="text-[9px] text-muted-foreground">{t('perf.regularHours')}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <Timer className="w-4 h-4 text-secondary mx-auto mb-1" />
                <p className="text-base font-extrabold text-secondary">{weekTotalOvertime.toFixed(1)}</p>
                <p className="text-[9px] text-muted-foreground">{t('perf.overtime')}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-base font-extrabold text-foreground">{weekTotalKm}</p>
                <p className="text-[9px] text-muted-foreground">{t('perf.totalKm')}</p>
              </div>
            </motion.div>

            {/* Work log */}
            <CollapsibleSection
              icon={Clock}
              iconColor="text-primary"
              title={t('perf.workLog')}
              open={showWorkLog}
              onToggle={() => setShowWorkLog(!showWorkLog)}
              defaultOpen
            >
              {workLogs.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold text-foreground">{entry.day}, {entry.date}</p>
                    <div className="flex items-center gap-1.5">
                      {entry.overtimeH > 0 && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
                          +{entry.overtimeH.toFixed(1)}h Ueberstunden
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {entry.start} - {entry.end}
                    </span>
                    <span>Pause {entry.breakMin} min</span>
                    <span className="ml-auto font-semibold text-foreground">{entry.regularH.toFixed(1)}h</span>
                  </div>
                  {/* Work hours bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary/70 rounded-l-full" style={{ width: `${(entry.regularH / 10) * 100}%` }} />
                    {entry.overtimeH > 0 && (
                      <div className="h-full bg-secondary/70" style={{ width: `${(entry.overtimeH / 10) * 100}%` }} />
                    )}
                  </div>
                </motion.div>
              ))}
            </CollapsibleSection>

            {/* Login history */}
            <CollapsibleSection
              icon={Smartphone}
              iconColor="text-primary"
              title={t('perf.loginHistory')}
              open={showLoginLog}
              onToggle={() => setShowLoginLog(!showLoginLog)}
            >
              {[].map((entry: { date: string; time: string; device: string; ip: string }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl px-4 py-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <LogIn className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{entry.date}</p>
                      <p className="text-[10px] text-muted-foreground">{entry.device}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{entry.time}</p>
                    <p className="text-[9px] text-muted-foreground">{entry.ip}</p>
                  </div>
                </motion.div>
              ))}
            </CollapsibleSection>
          </>
        )}

        {/* =================== VISITS SUCCESS TAB =================== */}
        {reportTab === 'visits' && (
          <>
            {/* Monthly success rates */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('perf.monthlyRate')}</h3>
              <div className="space-y-2.5">
                {Object.entries(performanceData?.monthlyVisitSuccess ?? {}).map(([month, d], i) => {
                  const rate = Math.round((d.completed / d.assigned) * 100);
                  const bonusEligible = rate >= 95;
                  return (
                    <motion.div
                      key={month}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`bg-card border rounded-xl px-4 py-3 ${bonusEligible ? 'border-primary/30' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-foreground">{month}</p>
                        <div className="flex items-center gap-2">
                          {bonusEligible && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                              Bonus
                            </span>
                          )}
                          <span className={`text-sm font-extrabold ${rate >= 95 ? 'text-primary' : rate >= 85 ? 'text-secondary' : 'text-destructive'}`}>
                            {rate}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          {d.completed} {t('perf.completed')}
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-destructive" />
                          {d.skipped} {t('perf.skipped')}
                        </span>
                        <span className="ml-auto text-foreground font-semibold">{d.assigned} {t('perf.total')}</span>
                      </div>
                      {/* Rate bar */}
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${rate >= 95 ? 'bg-primary' : rate >= 85 ? 'bg-secondary' : 'bg-destructive/70'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${rate}%` }}
                          transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Yearly summary */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('perf.yearOverview')}</h3>
              <div className="space-y-2.5">
                {Object.entries(performanceData?.yearlyVisitSuccess ?? {}).map(([year, d], i) => {
                  const rate = Math.round((d.completed / d.assigned) * 100);
                  return (
                    <motion.div
                      key={year}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card border border-border rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-foreground">{year}</p>
                        <div className="flex items-center gap-1">
                          <ProgressRing progress={rate / 100} size={40} strokeWidth={3}>
                            <span className="text-[10px] font-extrabold text-foreground">{rate}%</span>
                          </ProgressRing>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-extrabold text-primary">{d.completed}</p>
                          <p className="text-[9px] text-muted-foreground">{t('perf.completed')}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-extrabold text-destructive">{d.skipped}</p>
                          <p className="text-[9px] text-muted-foreground">{t('perf.skipped')}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-extrabold text-foreground">{d.regularH}h</p>
                          <p className="text-[9px] text-muted-foreground">{t('perf.regularHours')}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-extrabold text-secondary">{d.overtimeH}h</p>
                          <p className="text-[9px] text-muted-foreground">{t('perf.overtime')}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}

        {/* =================== ACTIVITY / GPS TRACKING TAB =================== */}
        {reportTab === 'activity' && (
          <ActivityTab performanceData={performanceData} />
        )}
      </div>

      <div className="px-4 pb-4">
        <LeaderboardCard />
      </div>

      <div className="h-6" />
    </AppLayout>
  );
};


// =================== ACTIVITY TAB COMPONENT ===================
const activityTypeConfig = {
  start: { icon: 'START', color: 'bg-primary/10 text-primary', dotColor: 'bg-primary' },
  break: { icon: 'BREAK', color: 'bg-secondary/10 text-secondary', dotColor: 'bg-secondary' },
  end: { icon: 'END', color: 'bg-card', dotColor: 'bg-muted-foreground' },
};

type ActivityEntry = {
  time: string;
  type: keyof typeof activityTypeConfig;
  label: string;
  location: string;
  duration?: string | null;
};

const ActivityTab = ({ performanceData }: { performanceData: DriverPerformanceData | null }) => {
  const [showTimeline, setShowTimeline] = useState(true);
  const workLogs = performanceData?.workLogs ?? [];
  const today = workLogs[0];
  const entries: ActivityEntry[] = [
    ...(today?.start ? [{
      time: today.start,
      type: 'start' as const,
      label: 'Arbeitsbeginn',
      location: 'driver_activity_logs',
    }] : []),
    ...(today?.breakMin ? [{
      time: today.start ?? '--:--',
      type: 'break' as const,
      label: 'Pausenzeit erfasst',
      location: `${today.breakMin} Minuten`,
      duration: `${today.breakMin} min`,
    }] : []),
    ...(today?.end ? [{
      time: today.end,
      type: 'end' as const,
      label: 'Arbeitsende',
      location: 'driver_activity_logs',
    }] : []),
  ];
  const weekTotalWork = workLogs.reduce((sum, log) => sum + log.regularH + log.overtimeH, 0);
  const weekTotalBreak = workLogs.reduce((sum, log) => sum + log.breakMin, 0);
  const weekTotalKm = workLogs.reduce((sum, log) => sum + log.km, 0);

  return (
    <>
      {/* Tracking awareness banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-primary/20 rounded-xl p-3.5 flex items-start gap-3"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Eye className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Aktivitaetsprotokoll</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            Es werden nur echte Arbeitsprotokolle angezeigt. GPS-Feindaten erscheinen hier erst, wenn Live-Tracking-Daten im Backend vorhanden sind.
          </p>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-4 gap-2">
        <div className="bg-card border border-border rounded-xl p-2.5 text-center">
          <Briefcase className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-sm font-extrabold text-foreground">{weekTotalWork.toFixed(1)}h</p>
          <p className="text-[8px] text-muted-foreground">Arbeit</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5 text-center">
          <Coffee className="w-3.5 h-3.5 text-secondary mx-auto mb-1" />
          <p className="text-sm font-extrabold text-secondary">{weekTotalBreak} min</p>
          <p className="text-[8px] text-muted-foreground">Pause</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5 text-center">
          <Navigation className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-sm font-extrabold text-foreground">{weekTotalKm}</p>
          <p className="text-[8px] text-muted-foreground">km</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5 text-center">
          <Gauge className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-sm font-extrabold text-muted-foreground">--</p>
          <p className="text-[8px] text-muted-foreground">GPS</p>
        </div>
      </motion.div>

      {/* Weekly activity breakdown */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-xs font-bold text-foreground mb-3">Echte Arbeitsprotokolle</h3>
        {workLogs.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-xl">
            <p className="text-xs font-semibold text-foreground">Noch keine Aktivitaetsdaten</p>
            <p className="text-[10px] text-muted-foreground mt-1">driver_activity_logs enthaelt noch keine Eintraege fuer diesen Fahrer.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workLogs.slice(0, 7).map((log) => (
              <div key={log.date} className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground w-9">{log.day}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-primary/70" style={{ width: `${Math.min(100, ((log.regularH + log.overtimeH) / 10) * 100)}%` }} title="Arbeit" />
                </div>
                <span className="text-[9px] text-muted-foreground w-16 text-right">{(log.regularH + log.overtimeH).toFixed(1)}h</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Today's timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-foreground"
        >
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Heutige Aktivitaet (Timeline)
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showTimeline ? 'rotate-180' : ''}`} />
        </button>

        {showTimeline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden mt-2"
          >
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />

              {entries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-center">
                  <p className="text-xs font-semibold text-foreground">Keine heutige Timeline verfuegbar</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Arbeitsbeginn, Pause und Arbeitsende erscheinen hier nach echten Backend-Eintraegen.</p>
                </div>
              ) : (
              <div className="space-y-0.5">
                {entries.map((entry, i) => {
                  const config = activityTypeConfig[entry.type];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`relative rounded-lg px-3 py-2 ${config.color}`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-[-18px] top-3 w-2.5 h-2.5 rounded-full ${config.dotColor} border-2 border-card z-10`} />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">{config.icon}</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-foreground truncate">{entry.label}</p>
                            <p className="text-[9px] text-muted-foreground truncate">{entry.location}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-[10px] font-bold text-foreground">{entry.time}</p>
                          {entry.duration && (
                            <p className="text-[9px] text-muted-foreground">{entry.duration}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

// Reusable collapsible section component
const CollapsibleSection = ({
  icon: Icon, iconColor, title, open, onToggle, defaultOpen, children
}: {
  icon: any; iconColor: string; title: string; open: boolean; onToggle: () => void; defaultOpen?: boolean; children: React.ReactNode;
}) => {
  // Auto-open if defaultOpen
  const isOpen = defaultOpen !== undefined ? (open || defaultOpen) : open;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-foreground"
      >
        <span className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden mt-2 space-y-2"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

const StatBox = ({ icon: Icon, value, label, sub }: { icon: any; value: string; label: string; sub: string }) => (
  <div className="bg-card border border-border rounded-2xl p-3 text-center">
    <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-[9px] text-muted-foreground/70">{sub}</p>
  </div>
);

export default Performance;

