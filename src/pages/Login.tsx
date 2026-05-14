import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NetworkPattern from '@/components/NetworkPattern';
import PinPad, { isPinSetup, isPinSessionActive, setPinSessionActive } from '@/components/PinPad';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import logoApp from '@/assets/logo-app.png';
import logoCompany from '@/assets/logo-company.png';
import mascot from '@/assets/mascot.png';

const ONBOARDING_KEY = 'rs_onboarding_done';

const useRestAuth = import.meta.env.VITE_DRIVER_API_PROVIDER === 'rest';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, session } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'welcome' | 'login' | 'pin-verify' | 'pin-setup'>('welcome');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([isPinSetup(), isPinSessionActive()]).then(([pinSetup, pinSessionActive]) => {
      if (!cancelled && pinSetup && !pinSessionActive) {
        setStep('pin-verify');
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Show onboarding on first visit
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingDone = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleLogin = async () => {
    if (!email || !password) { setError(t('login.fillAll')); return; }
    setError('');
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      setError(useRestAuth ? (error.trim() || t('login.wrongCredsRest')) : t('login.wrongCreds'));
    } else {
      if (!await isPinSetup()) {
        setStep('pin-setup');
      } else {
        await setPinSessionActive();
        navigate('/');
      }
    }
  };

  const handlePinSuccess = async () => {
    await setPinSessionActive();
    navigate('/');
  };

  const handlePinSetupDone = async () => {
    await setPinSessionActive();
    navigate('/');
  };

  // Onboarding overlay
  if (showOnboarding) {
    return <OnboardingTutorial onDone={handleOnboardingDone} />;
  }

  // PIN screens
  if (step === 'pin-verify') {
    return (
      <PinPad
        mode="verify"
        onSuccess={handlePinSuccess}
        onCancel={() => setStep('welcome')}
        onUsePassword={() => setStep('login')}
      />
    );
  }

  if (step === 'pin-setup') {
    return (
      <PinPad
        mode="setup"
        onSuccess={handlePinSetupDone}
        onCancel={handlePinSetupDone}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative overflow-hidden">
      {/* Animated wave background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <NetworkPattern color="hsl(145, 63%, 32%)" opacity={0.04} animate nodeCount={12} />
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: '45%' }}>
          <motion.path
            d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,229.3C672,235,768,213,864,186.7C960,160,1056,128,1152,133.3C1248,139,1344,181,1392,202.7L1440,224L1440,320L0,320Z"
            fill="hsl(145, 63%, 32%)"
            fillOpacity="0.04"
            animate={{ d: [
              "M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,229.3C672,235,768,213,864,186.7C960,160,1056,128,1152,133.3C1248,139,1344,181,1392,202.7L1440,224L1440,320L0,320Z",
              "M0,192L48,208C96,224,192,256,288,250.7C384,245,480,203,576,186.7C672,171,768,181,864,202.7C960,224,1056,256,1152,245.3C1248,235,1344,181,1392,154.7L1440,128L1440,320L0,320Z",
              "M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,229.3C672,235,768,213,864,186.7C960,160,1056,128,1152,133.3C1248,139,1344,181,1392,202.7L1440,224L1440,320L0,320Z",
            ]}}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L0,320Z"
            fill="hsl(145, 63%, 32%)"
            fillOpacity="0.06"
            animate={{ d: [
              "M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L0,320Z",
              "M0,288L48,272C96,256,192,224,288,218.7C384,213,480,235,576,250.7C672,267,768,277,864,266.7C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L0,320Z",
              "M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L0,320Z",
            ]}}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.path
            d="M0,288L48,282.7C96,277,192,267,288,266.7C384,267,480,277,576,272C672,267,768,245,864,240C960,235,1056,245,1152,256C1248,267,1344,277,1392,282.7L1440,288L1440,320L0,320Z"
            fill="hsl(42, 92%, 56%)"
            fillOpacity="0.04"
            animate={{ d: [
              "M0,288L48,282.7C96,277,192,267,288,266.7C384,267,480,277,576,272C672,267,768,245,864,240C960,235,1056,245,1152,256C1248,267,1344,277,1392,282.7L1440,288L1440,320L0,320Z",
              "M0,272L48,277.3C96,283,192,293,288,288C384,283,480,261,576,256C672,251,768,261,864,272C960,283,1056,293,1152,288C1248,283,1344,261,1392,250.7L1440,240L1440,320L0,320Z",
              "M0,288L48,282.7C96,277,192,267,288,266.7C384,267,480,277,576,272C672,267,768,245,864,240C960,235,1056,245,1152,256C1248,267,1344,277,1392,282.7L1440,288L1440,320L0,320Z",
            ]}}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </svg>
        <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-primary/[0.04] blur-3xl" />

        {/* Giant rotating company logo watermark */}
        <motion.img
          src={logoCompany}
          alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] object-contain opacity-[0.04] pointer-events-none select-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-10 flex rounded-full border border-border overflow-hidden bg-card/80 backdrop-blur-sm shadow-sm">
        {(['de', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'welcome' ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="relative flex flex-col items-center justify-between min-h-screen px-8 py-8"
          >
            {/* Top spacer */}
            <div />

            {/* Center: Logo + Combined branding */}
            <div className="flex flex-col items-center">
              {/* App logo */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                className="mb-3"
              >
                <img
                  src={logoApp}
                  alt="Recycle Solution"
                  className="w-20 h-20 object-contain drop-shadow-lg"
                />
              </motion.div>

              {/* Brand text */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-1"
              >
                <h1 className="text-[24px] font-extrabold text-foreground tracking-tight leading-none">
                  Recycle Solution
                </h1>
                <motion.p
                  initial={{ opacity: 0, letterSpacing: '0.5em' }}
                  animate={{ opacity: 1, letterSpacing: '0.28em' }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-[11px] font-bold text-primary uppercase tracking-[0.28em] mt-1"
                >
                  Beyond Collection
                </motion.p>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-[12px] text-muted-foreground mb-2"
              >
                {t('login.driverApp')}
              </motion.p>

              {/* Mascot Video */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.8 }}
                className="mb-3"
              >
                <video
                  src="/mascot-animation-sm.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-48 h-48 object-contain drop-shadow-lg"
                />
              </motion.div>

              {/* Sign in button */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="w-full max-w-xs space-y-2"
              >
                <Button
                  onClick={() => setStep('login')}
                  className="w-full h-13 text-[15px] font-semibold bg-gradient-brand hover:opacity-90 rounded-2xl shadow-brand"
                >
                  {t('login.signInBtn')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </div>

            {/* Bottom: Company branding */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2.5">
                <motion.img
                  src={logoCompany}
                  alt="GWM"
                  className="w-6 h-6 object-contain opacity-60"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <motion.span
                  initial={{ opacity: 0, letterSpacing: '0.6em' }}
                  animate={{ opacity: 0.6, letterSpacing: '0.18em' }}
                  transition={{ delay: 1.5, duration: 0.8, ease: 'easeOut' }}
                  className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.18em]"
                >
                  by German Waste Management GmbH
                </motion.span>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ delay: 2 }}
                className="text-[10px] text-muted-foreground font-medium"
              >
                v2.1.0 · © 2026
              </motion.p>
            </motion.div>
          </motion.div>
        ) : (
          /* ─── Login Form ─── */
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex flex-col justify-center min-h-screen px-6"
          >
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => { setStep('welcome'); setError(''); }}
              className="absolute top-12 left-6 p-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3">
                <img src={logoApp} alt="" className="w-9 h-9 object-contain drop-shadow-md" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t('login.welcome')}</h2>
                  <p className="text-[13px] text-muted-foreground">{t('login.signIn')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {useRestAuth ? t('login.loginId') : t('login.email')}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                  <Input
                    type={useRestAuth ? 'text' : 'email'}
                    placeholder={useRestAuth ? '+49… / fahrer@… / DRV-001' : 'fahrer@example.com'}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="pl-10 h-12 rounded-xl border-border bg-card text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                    autoFocus
                    autoComplete={useRestAuth ? 'username' : 'email'}
                  />
                </div>
                {useRestAuth ? (
                  <p className="text-[11px] text-muted-foreground leading-snug px-0.5">{t('login.loginIdHint')}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('login.password')}</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pl-10 pr-12 h-12 rounded-xl border-border bg-card text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-2 text-xs text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-12 text-[15px] font-semibold bg-gradient-brand hover:opacity-90 rounded-xl shadow-brand relative overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                      <span>{t('login.signingIn')}</span>
                    </motion.div>
                  ) : (
                    <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {t('login.signInBtn')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <img src={logoCompany} alt="GWM" className="w-4 h-4 object-contain" />
                <span className="text-[10px] text-muted-foreground/50 font-medium">German Waste Management GmbH</span>
              </div>
              <p className="text-[10px] text-muted-foreground/35 font-medium">v2.1.0 · © 2026 Recycle Solution GmbH</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
