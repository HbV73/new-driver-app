import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Coffee, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFatigueMonitor } from '@/hooks/useFatigueMonitor';
import { useLanguage } from '@/contexts/LanguageContext';

interface FatigueBannerProps {
  workStartedAt: Date | null;
  isDriving: boolean;
  onBreak: boolean;
  breakStartedAt?: Date | null;
  onTakeBreak?: () => void;
}

const FatigueBanner = ({ workStartedAt, isDriving, onBreak, breakStartedAt, onTakeBreak }: FatigueBannerProps) => {
  const { t } = useLanguage();
  const { level, minutesUntilBreak, continuousMin } = useFatigueMonitor({
    workStartedAt, isDriving, onBreak, breakStartedAt,
  });

  if (level === 'ok') return null;

  const isHard = level === 'hard';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className={`mx-4 mt-3 rounded-2xl border p-3 ${
          isHard
            ? 'bg-destructive/10 border-destructive/40 text-destructive'
            : 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isHard ? 'bg-destructive/20' : 'bg-amber-500/20'
          }`}>
            {isHard ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {isHard ? t('fatigue.hard.title') : t('fatigue.preWarn.title')}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {isHard
                ? t('fatigue.hard.body')
                : t('fatigue.preWarn.body').replace('{min}', String(minutesUntilBreak))}
            </p>
            <p className="text-[10px] opacity-70 mt-1">
              {Math.floor(continuousMin / 60)}h {continuousMin % 60}m
            </p>
          </div>
          {onTakeBreak && (
            <Button
              size="sm"
              variant={isHard ? 'destructive' : 'outline'}
              onClick={onTakeBreak}
              className="shrink-0"
            >
              <Coffee className="w-3.5 h-3.5 mr-1" />
              {t('fatigue.takeBreak')}
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FatigueBanner;
