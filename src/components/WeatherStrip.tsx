import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, ChevronDown, Droplets } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const weatherForecast = [
  { time: '08:00', temp: 8, icon: '⛅', wind: 12 },
  { time: '10:00', temp: 11, icon: '☀️', wind: 8 },
  { time: '12:00', temp: 14, icon: '☀️', wind: 10 },
  { time: '14:00', temp: 12, icon: '🌧️', wind: 22 },
  { time: '16:00', temp: 10, icon: '🌧️', wind: 18 },
];

const WeatherStrip = () => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const current = weatherForecast[0];

  return (
    <div className="bg-gradient-brand px-4 pb-3 -mt-px">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 transition-colors hover:bg-white/15 text-primary-foreground"
      >
        <span className="text-lg leading-none">{current.icon}</span>
        <span className="text-sm font-bold">{current.temp}°C</span>
        <span className="text-[10px] opacity-70 flex items-center gap-0.5">
          <Wind className="w-2.5 h-2.5" />{current.wind} km/h
        </span>
        <span className="text-[10px] font-semibold flex items-center gap-0.5 ml-auto bg-white/15 px-2 py-0.5 rounded-full">
          <Droplets className="w-2.5 h-2.5" />{t('rainAt')}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between mt-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-primary-foreground">
              {weatherForecast.map((w, i) => (
                <div key={i} className="text-center flex-1">
                  <p className="text-[9px] opacity-60">{w.time}</p>
                  <p className="text-base leading-tight mt-0.5">{w.icon}</p>
                  <p className="text-[11px] font-bold mt-0.5">{w.temp}°</p>
                  <p className="text-[8px] opacity-50 flex items-center justify-center gap-0.5 mt-0.5">
                    <Wind className="w-2 h-2" />{w.wind}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeatherStrip;
