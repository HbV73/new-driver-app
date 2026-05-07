import { motion } from 'framer-motion';
import { Droplet, Calendar, Sparkles } from 'lucide-react';
import { useFillPrediction, refreshFillPrediction } from '@/hooks/useFillPrediction';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  customerRef: string;
  customerName: string;
}

export default function FillPredictionCard({ customerRef, customerName }: Props) {
  const { t } = useLanguage();
  const { prediction } = useFillPrediction(customerRef);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refreshFillPrediction(customerRef, customerName); } finally { setRefreshing(false); }
  };

  const pct = prediction?.predicted_fill_percent ?? 0;
  const fullDate = prediction?.predicted_full_date;
  const conf = prediction ? Math.round(prediction.confidence * 100) : 0;

  // Color by fill %
  const barColor = pct >= 80 ? 'bg-destructive' : pct >= 50 ? 'bg-amber-500' : 'bg-primary';

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">{t('fill.title')}</h4>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? '…' : t('fill.refresh')}
        </Button>
      </div>

      {prediction ? (
        <>
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full ${barColor}`}
              />
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums w-10 text-right">{pct}%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {fullDate ? `${t('fill.fullBy')} ${fullDate}` : t('fill.unknownDate')}
            </span>
            <span>{t('fill.confidence')} {conf}%</span>
          </div>
          {prediction.reasoning && (
            <p className="text-[11px] text-muted-foreground italic line-clamp-2">{prediction.reasoning}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{t('fill.noData')}</p>
      )}
    </motion.div>
  );
}
