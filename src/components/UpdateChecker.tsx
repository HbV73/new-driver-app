import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Sparkles, CheckCircle2, X, Zap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

const CURRENT_VERSION = '1.0.0';
const LATEST_VERSION = '1.1.0'; // Mock — would come from backend
const RELEASE_DATE = '2026-04-20';

interface UpdateCheckerProps {
  onTrigger?: () => void;
}

const UpdateChecker = ({ onTrigger }: UpdateCheckerProps) => {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [checking, setChecking] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showUpToDate, setShowUpToDate] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);

  // Toggle to simulate "no update available" — flip to false to test that path
  const UPDATE_AVAILABLE = true;

  const handleCheck = async () => {
    setChecking(true);
    onTrigger?.();
    await new Promise((r) => setTimeout(r, 1200));
    setChecking(false);
    if (UPDATE_AVAILABLE) {
      setShowDialog(true);
    } else {
      setShowUpToDate(true);
      setTimeout(() => setShowUpToDate(false), 2200);
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    setProgress(0);
    for (let i = 1; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i);
    }
    await new Promise((r) => setTimeout(r, 400));
    window.location.reload();
  };

  const releaseNotes = de
    ? [
        'Schnellerer Tourstart und stabilere GPS-Aufzeichnung',
        'Neuer Kunden-Beleg per Drucker (ohne Bankdaten)',
        'Verbesserter Fahrernachweis für Polizeikontrollen',
        'Fehlerbehebungen und kleine UI-Verbesserungen',
      ]
    : [
        'Faster tour start and more stable GPS tracking',
        'New customer printout via mobile printer (no bank info)',
        'Improved driver log for police inspections',
        'Bug fixes and minor UI improvements',
      ];

  return (
    <>
      {/* Trigger card body */}
      <button
        onClick={handleCheck}
        disabled={checking}
        className="w-full flex items-center gap-3 disabled:opacity-70 transition-opacity"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <RefreshCw className={`w-5 h-5 text-primary ${checking ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">
            {de ? 'Nach Updates suchen' : 'Check for updates'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {de ? `Aktuelle Version ${CURRENT_VERSION}` : `Current version ${CURRENT_VERSION}`}
          </p>
        </div>
        <span className="text-[11px] font-semibold text-primary">
          {checking ? (de ? 'Prüfe…' : 'Checking…') : (de ? 'Prüfen' : 'Check')}
        </span>
      </button>

      {/* Up-to-date toast */}
      <AnimatePresence>
        {showUpToDate && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-success/10 border border-success/20"
          >
            <CheckCircle2 className="w-4 h-4 text-success" />
            <p className="text-xs font-medium text-success">
              {de ? 'Du hast die neueste Version!' : "You're on the latest version!"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => !installing && setShowDialog(o)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden gap-0 border-border/60">
          {/* Hero */}
          <div className="relative bg-gradient-brand text-primary-foreground p-6 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white blur-xl" />
            </div>

            {!installing && (
              <button
                onClick={() => setShowDialog(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
                aria-label="close"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <motion.div
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="relative w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3"
            >
              <Sparkles className="w-7 h-7" />
            </motion.div>

            <p className="relative text-[11px] font-bold uppercase tracking-widest text-white/80 mb-1">
              {de ? 'Update verfügbar' : 'Update available'}
            </p>
            <h2 className="relative text-2xl font-bold tracking-tight">
              Version {LATEST_VERSION}
            </h2>
            <div className="relative flex items-center gap-2 mt-2">
              <span className="text-[11px] text-white/70 line-through">v{CURRENT_VERSION}</span>
              <span className="text-white/60">→</span>
              <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                v{LATEST_VERSION}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            {!installing ? (
              <>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {de ? 'Was ist neu' : "What's new"}
                </p>
                <ul className="space-y-2.5 mb-5">
                  {releaseNotes.map((note, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="flex items-start gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center mt-0.5 shrink-0">
                        <Zap className="w-3 h-3 text-success" />
                      </div>
                      <p className="text-[13px] text-foreground leading-snug">{note}</p>
                    </motion.li>
                  ))}
                </ul>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-4 pb-4 border-b border-border/50">
                  <span>{de ? 'Veröffentlicht' : 'Released'}: {RELEASE_DATE}</span>
                  <span>~ 4.2 MB</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDialog(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
                  >
                    {de ? 'Später' : 'Later'}
                  </button>
                  <button
                    onClick={handleInstall}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-brand flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {de ? 'Aktualisieren' : 'Update'}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {de ? 'Wird installiert…' : 'Installing…'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {de ? 'Bitte App nicht schließen' : "Please don't close the app"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums">{progress}%</span>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-brand rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateChecker;
