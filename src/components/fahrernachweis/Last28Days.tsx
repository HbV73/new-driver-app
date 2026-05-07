import { motion } from 'framer-motion';
import { Calendar, AlertTriangle } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { DayLog } from '@/data/fahrernachweisData';

interface Props {
  logs: DayLog[];
  onBack: () => void;
  onDayClick: (date: string) => void;
}

const statusColors: Record<string, string> = {
  worked: 'bg-success/15 text-success border-success/20',
  sick: 'bg-muted text-muted-foreground border-border/50',
  vacation: 'bg-secondary/15 text-secondary border-secondary/20',
  rest_day: 'bg-muted/60 text-muted-foreground border-border/30',
  training: 'bg-primary/15 text-primary border-primary/20',
};

const statusDot: Record<string, string> = {
  worked: 'bg-success',
  sick: 'bg-muted-foreground',
  vacation: 'bg-secondary',
  rest_day: 'bg-border',
  training: 'bg-primary',
};

const formatMinutes = (min: number) => {
  if (min === 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const Last28Days = ({ logs, onBack, onDayClick }: Props) => {
  const { t, lang } = useLanguage();
  const locale = lang === 'de' ? 'de-DE' : 'en-US';

  const gaps = logs.filter(l => !l.status).length;

  return (
    <AppLayout>
      <AppHeader title={t('fn.last28')} showBack onBack={onBack} />
      <div className="px-4 pt-4 pb-4 space-y-3">
        {/* Summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-card rounded-xl border border-border/50 px-3.5 py-2.5 shadow-card"
        >
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground flex-1">{t('fn.last28Days')}</span>
          {gaps > 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive">
              <AlertTriangle className="w-3 h-3" /> {gaps} {t('fn.gapsFound')}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-success">✓ {t('fn.noGapsFound')}</span>
          )}
        </motion.div>

        {/* Day List */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_70px_55px_55px] gap-1 px-3 py-2 border-b border-border/50 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>{t('fn.date')}</span>
            <span className="text-center">{t('fn.status')}</span>
            <span className="text-center">{t('fn.work')}</span>
            <span className="text-center">{t('fn.drive')}</span>
          </div>
          <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
            {logs.map((log, i) => {
              const d = new Date(log.date + 'T00:00:00');
              return (
                <motion.button
                  key={log.date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => onDayClick(log.date)}
                  className="w-full grid grid-cols-[1fr_70px_55px_55px] gap-1 px-3 py-2.5 hover:bg-muted/40 active:bg-muted/60 transition-all text-left items-center"
                >
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">
                      {d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${statusColors[log.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[log.status]}`} />
                      {t(`fn.status.${log.status}`)}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-foreground text-center">
                    {formatMinutes(log.totalWorkMinutes)}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground text-center">
                    {formatMinutes(log.driveMinutes)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Last28Days;
