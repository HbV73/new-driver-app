import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Package, Clock, TrendingUp, Flame, Wind, X } from 'lucide-react';
import ProgressRing from './ProgressRing';
import { DailySummary, DriverStats } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface MorningBriefingProps {
  summary: DailySummary;
  stats: DriverStats;
}

const weatherForecast = [
  { time: '08:00', temp: 8, icon: '⛅', wind: 12 },
  { time: '10:00', temp: 11, icon: '☀️', wind: 8 },
  { time: '12:00', temp: 14, icon: '☀️', wind: 10 },
  { time: '14:00', temp: 12, icon: '🌧️', wind: 22 },
  { time: '16:00', temp: 10, icon: '🌧️', wind: 18 },
];

const MorningBriefing = ({ summary, stats }: MorningBriefingProps) => {
  const { t } = useLanguage();
  const [showGreeting, setShowGreeting] = useState(true);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const progress = summary.completedVisits / summary.totalVisits;
  const hour = new Date().getHours();

  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const getGreeting = (hour: number, completedRatio: number) => {
    if (completedRatio >= 0.9) return { emoji: '🎉', title: t('greet.superWork'), subtitle: t('greet.superWorkSub') };
    if (hour >= 16) return { emoji: '🌇', title: t('greet.endSpurt'), subtitle: t('greet.endSpurtSub') };
    if (hour >= 13) return { emoji: '☕', title: t('greet.afternoon'), subtitle: t('greet.afternoonSub') };
    if (hour >= 10) return { emoji: '💪', title: t('greet.goingWell'), subtitle: t('greet.goingWellSub') };
    if (hour >= 6) return { emoji: '🌅', title: t('greet.morning'), subtitle: t('greet.morningSub') };
    return { emoji: '🌙', title: t('greet.evening'), subtitle: t('greet.eveningSub') };
  };

  const greeting = getGreeting(hour, progress);
  const current = weatherForecast[0];

  return (
    <div className="px-4 pt-4 space-y-3 relative">
      {/* Greeting toast */}
      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg bg-card rounded-xl px-4 py-3 shadow-lg border border-border/50 flex items-center gap-3"
          >
            <span className="text-xl">{greeting.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{greeting.title}</p>
              <p className="text-[11px] text-muted-foreground">{greeting.subtitle}</p>
            </div>
            <button onClick={() => setShowGreeting(false)} className="p-1 rounded-full hover:bg-muted">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats + Weather row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border/50 p-3.5 shadow-card"
      >
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3" />
                <span className="text-[10px] font-bold">{stats.currentStreak}d</span>
              </div>
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-bold">#{stats.rank}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                bis {summary.estimatedEndTime}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">{summary.estimatedOilKg} kg</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs font-semibold text-foreground">{summary.totalContainers}</span>
              </div>
            </div>
          </div>

          {/* Weather compact */}
          <button
            onClick={() => setWeatherExpanded(!weatherExpanded)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors min-w-[52px]"
          >
            <span className="text-lg leading-none">{current.icon}</span>
            <span className="text-xs font-bold text-foreground">{current.temp}°</span>
            <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
              <Wind className="w-2 h-2" />{current.wind}
            </span>
          </button>
        </div>

        {/* XP bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-muted-foreground font-medium">Lv.{stats.level} · {stats.points} Pkt</span>
            <span className="text-[9px] text-muted-foreground font-medium">Lv.{stats.level + 1}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-brand rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.levelProgress * 100}%` }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Weather expanded forecast */}
        <AnimatePresence>
          {weatherExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border/30">
                {weatherForecast.map((w, i) => (
                  <div key={i} className="text-center flex-1">
                    <p className="text-[9px] text-muted-foreground">{w.time}</p>
                    <p className="text-base leading-tight mt-0.5">{w.icon}</p>
                    <p className="text-[11px] font-bold text-foreground mt-0.5">{w.temp}°</p>
                    <p className="text-[8px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5">
                      <Wind className="w-2 h-2" />{w.wind}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center mt-2">
                <span className="text-[10px] font-semibold text-warning flex items-center gap-1 bg-warning/10 px-2.5 py-0.5 rounded-full">
                  <Droplets className="w-2.5 h-2.5" />{t('rainAt')}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MorningBriefing;
