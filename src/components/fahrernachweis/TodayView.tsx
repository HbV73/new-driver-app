import { motion } from 'framer-motion';
import { Clock, Car, Coffee, MapPin, Warehouse, FileText, AlertTriangle, ArrowRightLeft, Home } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { DayLog, StopType, getWorkRules } from '@/data/fahrernachweisData';

interface Props {
  log: DayLog;
  onBack: () => void;
}

const formatMinutes = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

const stopTypeIcon: Record<StopType, typeof Clock> = {
  customer_visit: MapPin,
  warehouse: Warehouse,
  home: Home,
  break: Coffee,
  suspicious: AlertTriangle,
  transit: ArrowRightLeft,
};

const stopTypeColor: Record<StopType, string> = {
  customer_visit: 'bg-primary/10 text-primary',
  warehouse: 'bg-secondary/10 text-secondary',
  home: 'bg-muted text-muted-foreground',
  break: 'bg-warning/10 text-warning',
  suspicious: 'bg-destructive/10 text-destructive',
  transit: 'bg-muted/60 text-muted-foreground',
};

const TodayView = ({ log, onBack }: Props) => {
  const { t, lang } = useLanguage();
  const locale = lang === 'de' ? 'de-DE' : 'en-US';
  const today = new Date();
  const rules = getWorkRules();

  // Check violations
  const violations: string[] = [];
  if (log.totalWorkMinutes > rules.maxDailyWorkMinutes) {
    violations.push(lang === 'de' ? `Arbeitszeit überschritten (max ${rules.maxDailyWorkMinutes / 60}h)` : `Work time exceeded (max ${rules.maxDailyWorkMinutes / 60}h)`);
  }
  if (log.totalWorkMinutes > rules.minBreakAfterMinutes && log.breakMinutes < rules.requiredBreakMinutes) {
    violations.push(lang === 'de' ? `Pflichtpause nicht eingehalten (min ${rules.requiredBreakMinutes} Min.)` : `Required break not taken (min ${rules.requiredBreakMinutes} min)`);
  }
  if (log.driveMinutes > rules.maxDriveMinutes) {
    violations.push(lang === 'de' ? `Fahrzeit überschritten (max ${rules.maxDriveMinutes / 60}h)` : `Drive time exceeded (max ${rules.maxDriveMinutes / 60}h)`);
  }

  return (
    <AppLayout>
      <AppHeader title={t('fn.todayView')} showBack onBack={onBack} />
      <div className="px-4 pt-4 pb-4 space-y-4">
        {/* Date Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 p-4 shadow-card text-center"
        >
          <p className="text-lg font-bold text-foreground">
            {today.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-semibold text-success">{t('fn.statusWorked')}</span>
          </div>
          {log.dailyHash && (
            <p className="mt-1 text-[9px] font-mono text-muted-foreground">
              Hash: {log.dailyHash}
            </p>
          )}
        </motion.div>

        {/* Violations */}
        {violations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-[11px] font-bold text-destructive uppercase">
                {lang === 'de' ? 'Regelverstöße' : 'Violations'}
              </span>
            </div>
            {violations.map((v, i) => (
              <p key={i} className="text-[11px] text-destructive/80">• {v}</p>
            ))}
          </motion.div>
        )}

        {/* Time Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { icon: Clock, label: t('fn.workTime'), value: log.workStart && log.workEnd ? `${log.workStart} – ${log.workEnd}` : '—', sub: formatMinutes(log.totalWorkMinutes), color: 'text-primary' },
            { icon: Car, label: t('fn.driveTime'), value: formatMinutes(log.driveMinutes), sub: `${log.drivenKm} km`, color: 'text-secondary' },
            { icon: Coffee, label: t('fn.breakTime'), value: formatMinutes(log.breakMinutes), sub: '', color: 'text-warning' },
            { icon: Warehouse, label: lang === 'de' ? 'Lagerzeit' : 'Warehouse', value: formatMinutes(log.warehouseMinutes), sub: '', color: 'text-muted-foreground' },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl border border-border/50 p-3 shadow-card">
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{stat.label}</span>
              </div>
              <p className="text-sm font-bold text-foreground">{stat.value}</p>
              {stat.sub && <p className="text-[10px] text-muted-foreground">{stat.sub}</p>}
            </div>
          ))}
        </motion.div>

        {/* Notes */}
        {log.notes && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            className="bg-warning/5 border border-warning/20 rounded-xl p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-warning" />
              <span className="text-[10px] font-bold text-warning uppercase">{lang === 'de' ? 'Anmerkungen' : 'Notes'}</span>
            </div>
            <p className="text-xs text-foreground">{log.notes}</p>
          </motion.div>
        )}

        {/* Visits with stop type */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border/50">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('fn.visitsToday')}</h3>
          </div>
          <div className="divide-y divide-border/40">
            {log.visits.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('fn.noVisits')}</p>
            ) : (
              log.visits.map((v, i) => {
                const Icon = stopTypeIcon[v.stopType] || MapPin;
                const color = stopTypeColor[v.stopType] || 'bg-muted text-muted-foreground';
                return (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{v.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {v.arrivalTime} – {v.departureTime}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default TodayView;
