import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle, Navigation, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { GeofenceCheck } from '@/hooks/useGeofence';
import { useState } from 'react';

interface Props {
  open: boolean;
  checking: boolean;
  check: GeofenceCheck | null;
  errorCode: string | null;
  onClose: () => void;
  onConfirmStart: () => void;
  onOverride: (reason: string) => void;
  onNavigateToDepot: () => void;
}

const GeofenceStartDialog = ({
  open,
  checking,
  check,
  errorCode,
  onClose,
  onConfirmStart,
  onOverride,
  onNavigateToDepot,
}: Props) => {
  const { t } = useLanguage();
  const [showOverride, setShowOverride] = useState(false);
  const [reason, setReason] = useState('');

  if (!open) return null;

  const handleClose = () => {
    setShowOverride(false);
    setReason('');
    onClose();
  };

  const renderBody = () => {
    if (checking) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">{t('geo.checking')}</p>
        </div>
      );
    }

    if (errorCode === 'PERMISSION_DENIED') {
      return (
        <div className="text-center py-6">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-3" />
          <p className="text-sm text-foreground">{t('geo.permissionDenied')}</p>
        </div>
      );
    }

    if (errorCode === 'POSITION_UNAVAILABLE' || errorCode === 'GEOLOCATION_UNSUPPORTED') {
      return (
        <div className="text-center py-6">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-3" />
          <p className="text-sm text-foreground">{t('geo.unavailable')}</p>
        </div>
      );
    }

    if (!check) return null;

    if (showOverride) {
      const tooShort = reason.trim().length < 20;
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">{t('geo.emergencyTitle')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('geo.emergencyDesc')}</p>
            </div>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('geo.emergencyPlaceholder')}
            autoFocus
            className="w-full h-24 bg-muted/50 border border-border/50 rounded-xl px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-warning/30 focus:border-warning/50"
          />
          <p className={`text-[11px] ${tooShort ? 'text-warning' : 'text-primary'}`}>
            {reason.trim().length}/20 · {t('geo.emergencyMin')}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowOverride(false)} className="flex-1 h-11 rounded-xl">
              {t('wt.back')}
            </Button>
            <Button
              onClick={() => onOverride(reason.trim())}
              disabled={tooShort}
              className="flex-1 h-11 rounded-xl bg-warning text-warning-foreground hover:opacity-90"
            >
              {t('geo.confirmStart')}
            </Button>
          </div>
        </div>
      );
    }

    if (check.allowed) {
      const ok = check.locationType === 'depot';
      return (
        <div className="space-y-3">
          <div className={`flex items-start gap-2 p-3 rounded-xl ${ok ? 'bg-primary/10 border-primary/30' : 'bg-secondary/10 border-secondary/30'} border`}>
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ok ? 'text-primary' : 'text-secondary'}`} />
            <div>
              <p className="text-sm font-bold text-foreground">
                {ok ? t('geo.atDepot') : t('geo.preloadedActive')}
              </p>
              {check.distanceM != null && check.depot && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('geo.distanceFromDepot')}: {check.distanceM} m · {check.depot.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 h-11 rounded-xl">
              {t('wt.cancel')}
            </Button>
            <Button onClick={onConfirmStart} className="flex-1 h-11 rounded-xl bg-gradient-brand">
              {t('workTime.start')}
            </Button>
          </div>
        </div>
      );
    }

    // Blocked
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">{t('geo.notAtDepot')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('geo.mustGoToDepot')}</p>
            {check.distanceM != null && check.depot && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {t('geo.distanceFromDepot')}: <span className="font-bold">{check.distanceM} m</span> · {check.depot.name}
              </p>
            )}
          </div>
        </div>
        <Button onClick={onNavigateToDepot} className="w-full h-11 rounded-xl bg-primary">
          <Navigation className="w-4 h-4 mr-2" /> {t('geo.navigateToDepot')}
        </Button>
        <button
          onClick={() => setShowOverride(true)}
          className="w-full text-xs text-warning font-semibold hover:underline py-2"
        >
          {t('geo.emergencyStart')}
        </button>
        <button onClick={handleClose} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">
          {t('wt.cancel')}
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-brand px-5 pt-5 pb-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <h2 className="text-base font-extrabold">{t('workTime.start')}</h2>
            </div>
          </div>
          <div className="px-5 py-5">{renderBody()}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GeofenceStartDialog;
