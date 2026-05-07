import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Delete, Check, X } from 'lucide-react';
import NetworkPattern from '@/components/NetworkPattern';
import { useLanguage } from '@/contexts/LanguageContext';
import { setPin, verifyPin } from '@/lib/security/pinSecurity';

export {
  BIOMETRIC_KEY,
  PIN_SESSION_KEY,
  PIN_STORAGE_KEY,
  clearPinData,
  clearPinSession,
  isPinSessionActive,
  isPinSetup,
  setPinSessionActive,
} from '@/lib/security/pinSecurity';

interface PinPadProps {
  mode: 'setup' | 'verify';
  onSuccess: () => void;
  onCancel: () => void;
  onUsePassword?: () => void;
}

const PinPad = ({ mode, onSuccess, onCancel, onUsePassword }: PinPadProps) => {
  const { t } = useLanguage();
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const maxDigits = 4;
  const currentPin = step === 'confirm' ? confirmPin : pin;
  const title = mode === 'setup'
    ? step === 'confirm' ? t('pin.confirm') : t('pin.setup')
    : t('pin.enter');
  const subtitle = mode === 'setup'
    ? step === 'confirm' ? t('pin.reenter') : t('pin.choose4')
    : t('pin.quickAccess');

  const handleSetupConfirm = (newVal: string) => {
    if (newVal !== pin) {
      setError('PINs stimmen nicht ueberein');
      setTimeout(() => { setConfirmPin(''); setError(''); }, 1000);
      return;
    }

    void setPin(newVal).then(() => {
      setSuccess(true);
      setTimeout(onSuccess, 600);
    }).catch(() => {
      setError('PIN konnte nicht gespeichert werden');
      setTimeout(() => { setConfirmPin(''); setError(''); }, 1000);
    });
  };

  const handleVerify = (newVal: string) => {
    void verifyPin(newVal).then((result) => {
      if (result.ok) {
        setSuccess(true);
        setTimeout(onSuccess, 400);
        return;
      }

      if (result.lockedUntil) {
        const minutes = Math.max(1, Math.ceil((result.lockedUntil - Date.now()) / 60000));
        setError(`Zu viele Versuche. Bitte in ${minutes} Min. erneut versuchen.`);
      } else {
        setError('Falscher PIN');
      }
      setTimeout(() => { setPinValue(''); setError(''); }, 1200);
    }).catch(() => {
      setError('PIN konnte nicht geprueft werden');
      setTimeout(() => { setPinValue(''); setError(''); }, 1200);
    });
  };

  const handleDigit = (d: string) => {
    if (success) return;
    if (currentPin.length >= maxDigits) return;

    const newVal = currentPin + d;

    if (step === 'confirm') {
      setConfirmPin(newVal);
      if (newVal.length === maxDigits) handleSetupConfirm(newVal);
      return;
    }

    setPinValue(newVal);
    if (mode === 'verify' && newVal.length === maxDigits) {
      handleVerify(newVal);
    } else if (mode === 'setup' && newVal.length === maxDigits) {
      setTimeout(() => setStep('confirm'), 300);
    }
  };

  const handleDelete = () => {
    if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPinValue((prev) => prev.slice(0, -1));
    }
    setError('');
  };

  const handleBiometric = () => {
    setError('Biometrie ist noch nicht sicher aktiviert');
    setTimeout(() => setError(''), 1400);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative overflow-hidden flex flex-col items-center justify-center px-8">
      <div className="absolute inset-0 pointer-events-none">
        <NetworkPattern color="hsl(145, 63%, 32%)" opacity={0.05} animate nodeCount={12} />
      </div>

      <button
        onClick={onCancel}
        className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-muted/60 hover:bg-muted"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-4"
      >
        <video
          src="/mascot-animation-sm.webm"
          autoPlay
          loop
          muted
          playsInline
          className="w-24 h-24 object-contain drop-shadow-lg"
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </motion.div>

      <div className="flex items-center gap-4 mb-2">
        {Array.from({ length: maxDigits }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: currentPin.length === i ? 1.2 : 1,
              backgroundColor: error
                ? 'hsl(0, 72%, 51%)'
                : success
                  ? 'hsl(145, 63%, 32%)'
                  : i < currentPin.length
                    ? 'hsl(145, 63%, 32%)'
                    : 'hsl(var(--muted))',
            }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-4 h-4 rounded-full"
          />
        ))}
      </div>

      <div className="h-6 flex items-center">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-destructive font-medium"
            >
              {error}
            </motion.p>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              <Check className="w-4 h-4" /> Erfolgreich!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleDigit(String(n))}
            className="h-16 rounded-2xl bg-card border border-border text-xl font-bold text-foreground hover:bg-muted/80 active:bg-primary/10 transition-colors"
          >
            {n}
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleBiometric}
          className="h-16 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <Fingerprint className="w-6 h-6 text-primary" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-card border border-border text-xl font-bold text-foreground hover:bg-muted/80 active:bg-primary/10 transition-colors"
        >
          0
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
          className="h-16 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <Delete className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      {mode === 'verify' && onUsePassword && (
        <button
          onClick={onUsePassword}
          className="mt-6 text-xs text-primary font-medium hover:underline"
        >
          Mit Passwort anmelden
        </button>
      )}

      {mode === 'setup' && (
        <button
          onClick={onCancel}
          className="mt-6 text-xs text-muted-foreground font-medium hover:underline"
        >
          Ueberspringen
        </button>
      )}
    </div>
  );
};

export default PinPad;
