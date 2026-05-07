import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserX, Camera, Mic, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Visit } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

const FailedVisitDialog = ({ open, onClose, onComplete, visit }: {
  open: boolean;
  onClose: () => void;
  onComplete: (reason: string, note: string) => void | Promise<void>;
  visit: Visit;
}) => {
  const { t } = useLanguage();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const FAILURE_REASONS = [
    { id: 'not_present', label: t('failed.notPresent'), emoji: '🚪' },
    { id: 'closed', label: t('failed.closed'), emoji: '🔒' },
    { id: 'refused', label: t('failed.refused'), emoji: '🚫' },
    { id: 'no_access', label: t('failed.noAccess'), emoji: '🚧' },
    { id: 'other', label: t('failed.other'), emoji: '📝' },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return;
    const reason = FAILURE_REASONS.find(r => r.id === selectedReason);
    setSubmitting(true);
    try {
      await onComplete(reason?.label || selectedReason, note);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background w-full max-w-lg rounded-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl"
          >
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <UserX className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">{t('failed.title')}</h2>
                  <p className="text-[11px] text-muted-foreground">{visit.customerName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">{t('failed.selectReason')}</p>
                <div className="space-y-2">
                  {FAILURE_REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all border ${
                        selectedReason === reason.id
                          ? 'border-destructive/40 bg-destructive/5 ring-1 ring-destructive/20'
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <span className="text-lg">{reason.emoji}</span>
                      <span className={`text-sm font-medium ${
                        selectedReason === reason.id ? 'text-foreground' : 'text-foreground/80'
                      }`}>
                        {reason.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">{t('failed.additionalInfo')} <span className="text-muted-foreground font-normal">({t('wt.optional').toLowerCase()})</span></p>
                <div className="flex gap-2 mb-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" disabled>
                    <Camera className="w-3.5 h-3.5 mr-1" />
                    {t('failed.photo')} (bald)
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" disabled>
                    <Mic className="w-3.5 h-3.5 mr-1" />
                    {t('failed.voiceNote')} (bald)
                  </Button>
                </div>
                <textarea
                  placeholder={t('failed.placeholder')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full min-h-[80px] rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20"
                />
              </div>
            </div>

            <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
              <Button
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                className="w-full h-12 text-base font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl"
              >
                {submitting ? '...' : t('failed.submit')}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FailedVisitDialog;
