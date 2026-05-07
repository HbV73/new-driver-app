import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Droplets, X, CloudRain, Sun } from 'lucide-react';
import { WeatherForecast } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

const mockWeather: WeatherForecast[] = [
  { time: '08:00', temp: 8, condition: 'cloudy', windKmh: 12, icon: '⛅' },
  { time: '10:00', temp: 11, condition: 'sunny', windKmh: 8, icon: '☀️' },
  { time: '12:00', temp: 14, condition: 'sunny', windKmh: 10, icon: '☀️' },
  { time: '14:00', temp: 12, condition: 'rainy', windKmh: 22, icon: '🌧️' },
  { time: '16:00', temp: 10, condition: 'rainy', windKmh: 18, icon: '🌧️' },
];

const AUTO_DISMISS_MS = 8000;

const WeatherWidget = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  const current = mockWeather[0];
  const hasRain = mockWeather.some(w => w.condition === 'rainy' || w.condition === 'stormy');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
        >
          <div className={`rounded-2xl border shadow-lg backdrop-blur-md px-4 py-3 ${
            hasRain
              ? 'bg-warning/10 border-warning/30'
              : 'bg-primary/5 border-primary/20'
          }`}>
            {/* Close button */}
            <button
              onClick={() => setVisible(false)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              {hasRain ? (
                <CloudRain className="w-4 h-4 text-warning" />
              ) : (
                <Sun className="w-4 h-4 text-primary" />
              )}
              <span className="text-xs font-semibold text-foreground">
                {hasRain ? 'Wetter-Warnung' : 'Wetter heute'}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto mr-4">Hannover</span>
            </div>

            {/* Current + alert */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{current.icon}</span>
              <div>
                <span className="text-lg font-bold text-foreground">{current.temp}°C</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-2">
                  <Wind className="w-2.5 h-2.5" />{current.windKmh} km/h
                </span>
              </div>
              {hasRain && (
                <span className="text-[11px] font-medium text-warning flex items-center gap-1 ml-auto bg-warning/15 px-2.5 py-1 rounded-full">
                  <Droplets className="w-3 h-3" />{t('rainAt')}
                </span>
              )}
            </div>

            {/* Hourly forecast */}
            <div className="flex items-center justify-between">
              {mockWeather.map((w, i) => (
                <div key={i} className="text-center flex-1">
                  <p className="text-[9px] text-muted-foreground">{w.time}</p>
                  <p className="text-sm leading-tight">{w.icon}</p>
                  <p className="text-[10px] font-medium text-foreground">{w.temp}°</p>
                </div>
              ))}
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className={`h-0.5 rounded-full mt-2 ${hasRain ? 'bg-warning/40' : 'bg-primary/30'}`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WeatherWidget;
