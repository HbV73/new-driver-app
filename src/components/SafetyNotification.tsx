import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SafetyTip } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface SafetyNotificationProps {
  maxPerDay?: number;
}

const SafetyNotification = ({ maxPerDay = 2 }: SafetyNotificationProps) => {
  const { t } = useLanguage();
  const [currentTip, setCurrentTip] = useState<SafetyTip | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [shownCount, setShownCount] = useState(0);

  const allTips: SafetyTip[] = [
    { id: 't1', title: t('safety.tirePressure'), message: t('safety.tirePressureMsg'), icon: '🔧', type: 'maintenance', priority: 'medium' },
    { id: 't2', title: t('safety.speed'), message: t('safety.speedMsg'), icon: '🚦', type: 'speed', priority: 'high' },
    { id: 't3', title: t('safety.oilLevel'), message: t('safety.oilLevelMsg'), icon: '🛢️', type: 'maintenance', priority: 'medium' },
    { id: 't4', title: t('safety.rain'), message: t('safety.rainMsg'), icon: '🌧️', type: 'weather', priority: 'high' },
  ];

  useEffect(() => {
    if (shownCount >= maxPerDay) return;
    const timer = setTimeout(() => {
      const next = allTips.find(t => !dismissed.includes(t.id));
      if (next) setCurrentTip(next);
    }, 3000);
    return () => clearTimeout(timer);
  }, [dismissed, shownCount, maxPerDay]);

  const handleDismiss = () => {
    if (currentTip) {
      setDismissed(prev => [...prev, currentTip.id]);
      setShownCount(prev => prev + 1);
      setCurrentTip(null);
    }
  };

  useEffect(() => {
    if (!currentTip) return;
    const timer = setTimeout(handleDismiss, 5000);
    return () => clearTimeout(timer);
  }, [currentTip]);

  return (
    <AnimatePresence>
      {currentTip && (
        <motion.div
          initial={{ opacity: 0, y: -60, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -60, x: '-50%' }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed top-14 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg"
        >
          <div className="flex items-center gap-2.5 bg-card/95 backdrop-blur-md rounded-xl border border-border px-3.5 py-2.5 shadow-lg">
            <span className="text-lg">{currentTip.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{currentTip.title}</p>
              <p className="text-[10px] text-muted-foreground leading-snug">{currentTip.message}</p>
            </div>
            <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-muted/50 flex-shrink-0">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          {/* Auto-dismiss progress */}
          <motion.div
            className="h-0.5 bg-primary/30 rounded-full mx-3 mt-1"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SafetyNotification;
