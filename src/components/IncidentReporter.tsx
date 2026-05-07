import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

export type IncidentType = 'traffic' | 'flat_tire' | 'breakdown' | 'fuel' | 'accident' | 'other';

interface IncidentReporterProps {
  onSubmit?: (type: IncidentType, note: string, estimatedDelay: number) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const IncidentReporter = ({ onSubmit, open: controlledOpen, onOpenChange }: IncidentReporterProps) => {
  const { t } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [selected, setSelected] = useState<IncidentType | null>(null);
  const [note, setNote] = useState('');
  const [delay, setDelay] = useState('15');
  const [submitted, setSubmitted] = useState(false);

  const incidents = [
    { type: 'traffic' as IncidentType, label: t('incident.traffic'), icon: '🚦', description: t('incident.trafficDesc') },
    { type: 'flat_tire' as IncidentType, label: t('incident.flatTire'), icon: '🛞', description: t('incident.flatTireDesc') },
    { type: 'breakdown' as IncidentType, label: t('incident.breakdown'), icon: '🔧', description: t('incident.breakdownDesc') },
    { type: 'fuel' as IncidentType, label: t('incident.fuel'), icon: '⛽', description: t('incident.fuelDesc') },
    { type: 'accident' as IncidentType, label: t('incident.accident'), icon: '💥', description: t('incident.accidentDesc') },
    { type: 'other' as IncidentType, label: t('incident.other'), icon: '❓', description: t('incident.otherDesc') },
  ];

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit?.(selected, note, Number(delay));
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
      setSelected(null);
      setNote('');
      setDelay('15');
    }, 2000);
  };

  return (
    <>
      {controlledOpen === undefined && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <AlertTriangle className="w-4 h-4 mr-1.5" />
          {t('incident.title')}
        </Button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card rounded-t-3xl border-t border-border p-5 max-h-[85vh] overflow-y-auto"
            >
              {submitted ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <span className="text-5xl">✅</span>
                  <p className="text-lg font-bold text-foreground mt-3">{t('incident.reported')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('incident.reportedSub')}</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">{t('incident.title')}</h3>
                    <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-muted">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Incident type grid */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {incidents.map((inc) => (
                      <button
                        key={inc.type}
                        onClick={() => setSelected(inc.type)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          selected === inc.type
                            ? 'border-destructive bg-destructive/10 shadow-sm'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <span className="text-2xl">{inc.icon}</span>
                        <span className="text-[11px] font-semibold text-foreground leading-tight text-center">{inc.label}</span>
                      </button>
                    ))}
                  </div>

                  {selected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      {/* Estimated delay */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                          {t('incident.delay')}
                        </label>
                        <div className="flex items-center gap-2">
                          {['10', '15', '30', '45', '60+'].map((d) => (
                            <button
                              key={d}
                              onClick={() => setDelay(d.replace('+', ''))}
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                                delay === d.replace('+', '')
                                  ? 'bg-destructive text-destructive-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {d} min
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                          {t('incident.note')}
                        </label>
                        <Input
                          placeholder={t('incident.notePlaceholder')}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </div>

                      <Button
                        onClick={handleSubmit}
                        className="w-full h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                      >
                        <Send className="w-4 h-4 mr-1.5" />
                        {t('incident.submit')}
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default IncidentReporter;
