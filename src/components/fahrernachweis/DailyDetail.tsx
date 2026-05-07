import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Car, Coffee, MapPin, Warehouse, Home, AlertTriangle, ArrowRightLeft, FileText } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { DayLog, StopType } from '@/data/fahrernachweisData';

interface Props {
  log: DayLog;
  onBack: () => void;
}

const formatMinutes = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

const stopTypeConfig: Record<StopType, { icon: typeof Clock; label: { de: string; en: string }; color: string }> = {
  customer_visit: { icon: MapPin, label: { de: 'Kunde', en: 'Customer' }, color: 'text-primary bg-primary/10' },
  warehouse: { icon: Warehouse, label: { de: 'Lager', en: 'Warehouse' }, color: 'text-secondary bg-secondary/10' },
  home: { icon: Home, label: { de: 'Zuhause', en: 'Home' }, color: 'text-muted-foreground bg-muted' },
  break: { icon: Coffee, label: { de: 'Pause', en: 'Break' }, color: 'text-warning bg-warning/10' },
  suspicious: { icon: AlertTriangle, label: { de: 'Verdächtig', en: 'Suspicious' }, color: 'text-destructive bg-destructive/10' },
  transit: { icon: ArrowRightLeft, label: { de: 'Transit', en: 'Transit' }, color: 'text-muted-foreground bg-muted/60' },
};

const DailyDetail = ({ log, onBack }: Props) => {
  const { t, lang } = useLanguage();
  const locale = lang === 'de' ? 'de-DE' : 'en-US';
  const d = new Date(log.date + 'T00:00:00');

  // Group visits by stop type
  const stopCounts = log.visits.reduce((acc, v) => {
    acc[v.stopType] = (acc[v.stopType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <AppHeader title={t('fn.dayDetail')} showBack onBack={onBack} />
      <div className="px-4 pt-4 pb-4 space-y-4">
        {/* Date & Status */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 p-4 shadow-card text-center"
        >
          <p className="text-lg font-bold text-foreground">
            {d.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            log.status === 'worked' ? 'bg-success/10 text-success' :
            log.status === 'sick' ? 'bg-muted text-muted-foreground' :
            log.status === 'vacation' ? 'bg-secondary/10 text-secondary' :
            log.status === 'rest_day' ? 'bg-muted/60 text-muted-foreground' :
            'bg-primary/10 text-primary'
          }`}>
            {t(`fn.status.${log.status}`)}
          </span>
          {log.dailyHash && (
            <p className="mt-1 text-[9px] font-mono text-muted-foreground">
              Hash: {log.dailyHash} · {lang === 'de' ? 'Änderungen' : 'Edits'}: {log.editCount || 0}
            </p>
          )}
        </motion.div>

        {log.status === 'worked' && (
          <>
            {/* Time Stats */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { icon: Clock, label: t('fn.workTime'), value: `${log.workStart} – ${log.workEnd}`, sub: formatMinutes(log.totalWorkMinutes), color: 'text-primary' },
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

            {/* Stop Classification Summary */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
              className="bg-card rounded-xl border border-border/50 p-3 shadow-card"
            >
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {lang === 'de' ? 'Stopp-Klassifizierung' : 'Stop Classification'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stopCounts).map(([type, count]) => {
                  const config = stopTypeConfig[type as StopType];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <span key={type} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {config.label[lang]} ({count})
                    </span>
                  );
                })}
              </div>
            </motion.div>

            {/* Notes */}
            {log.notes && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="bg-warning/5 border border-warning/20 rounded-xl p-3"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-warning" />
                  <span className="text-[10px] font-bold text-warning uppercase">{lang === 'de' ? 'Anmerkungen' : 'Notes'}</span>
                </div>
                <p className="text-xs text-foreground">{log.notes}</p>
              </motion.div>
            )}

            {/* Visits */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border/50">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('fn.visitList')}</h3>
              </div>
              <div className="divide-y divide-border/40">
                {log.visits.map((v, i) => {
                  const config = stopTypeConfig[v.stopType];
                  const Icon = config?.icon || MapPin;
                  return (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config?.color || 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{v.customerName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {v.arrivalTime} – {v.departureTime} · {config?.label[lang] || v.stopType}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}

        {log.status !== 'worked' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl border border-border/50 p-6 shadow-card text-center"
          >
            <p className="text-sm text-muted-foreground">{t('fn.noWorkData')}</p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default DailyDetail;
