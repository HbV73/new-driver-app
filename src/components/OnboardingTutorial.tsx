import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Package, Clock, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import NetworkPattern from '@/components/NetworkPattern';
import logoApp from '@/assets/logo-app.png';

interface OnboardingTutorialProps {
  onDone: () => void;
}

const slides = [
  {
    icon: MapPin,
    titleDe: 'Tour planen',
    titleEn: 'Plan your tour',
    descDe: 'Sieh deine tägliche Route, navigiere zu Kunden und behalte den Überblick.',
    descEn: 'View your daily route, navigate to customers, and stay on track.',
    color: 'hsl(145, 63%, 42%)',
  },
  {
    icon: Package,
    titleDe: 'Sammlung erfassen',
    titleEn: 'Record collections',
    descDe: 'Scanne Behälter, erfasse Mengen und dokumentiere jeden Besuch digital.',
    descEn: 'Scan containers, record quantities, and document every visit digitally.',
    color: 'hsl(45, 93%, 47%)',
  },
  {
    icon: Clock,
    titleDe: 'Arbeitszeit & mehr',
    titleEn: 'Work time & more',
    descDe: 'Starte und beende deine Schicht, verwalte Ausgaben und bleib informiert.',
    descEn: 'Start and end your shift, manage expenses, and stay informed.',
    color: 'hsl(200, 70%, 50%)',
  },
];

const OnboardingTutorial = ({ onDone }: OnboardingTutorialProps) => {
  const [current, setCurrent] = useState(0);
  const { lang } = useLanguage();
  const isLast = current === slides.length - 1;

  const next = () => {
    if (isLast) {
      onDone();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const prev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <NetworkPattern color={slide.color} opacity={0.05} animate nodeCount={12} />
      </div>

      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onDone}
          className="p-2 rounded-full bg-muted/60 hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon circle */}
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
              style={{ backgroundColor: `${slide.color}15` }}
            >
              <Icon className="w-10 h-10" style={{ color: slide.color }} />
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-3">
              {lang === 'de' ? slide.titleDe : slide.titleEn}
            </h2>
            <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
              {lang === 'de' ? slide.descDe : slide.descEn}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + nav */}
      <div className="px-8 pb-10">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === current ? 24 : 8,
                height: 8,
                backgroundColor: i === current ? slide.color : 'hsl(var(--muted-foreground) / 0.2)',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {current > 0 && (
            <Button
              variant="outline"
              onClick={prev}
              className="h-12 px-4 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={next}
            className="flex-1 h-12 text-[15px] font-semibold bg-gradient-brand hover:opacity-90 rounded-xl shadow-brand"
          >
            {isLast
              ? (lang === 'de' ? 'Los geht\'s!' : 'Get started!')
              : (lang === 'de' ? 'Weiter' : 'Next')}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Logo at very bottom */}
      <div className="flex justify-center pb-4">
        <img src={logoApp} alt="" className="w-6 h-6 object-contain opacity-30" />
      </div>
    </div>
  );
};

export default OnboardingTutorial;
