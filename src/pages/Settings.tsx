import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Globe, Moon, Sun, Palette, HardDrive, Info } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import UpdateChecker from '@/components/UpdateChecker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

const Settings = () => {
  const { lang, setLang, t } = useLanguage();
  const de = lang === 'de';
  const [darkMode, setDarkMode] = useState(false);

  const handleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <AppLayout>
      <AppHeader title={de ? 'Einstellungen' : 'Settings'} showBack />
      <div className="px-4 pt-4 pb-4 space-y-4">

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 p-4 shadow-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{de ? 'Sprache' : 'Language'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {([['de', 'Deutsch 🇩🇪'], ['en', 'English 🇬🇧']] as const).map(([l, label]) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  lang === l
                    ? 'bg-primary text-primary-foreground shadow-brand'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-card"
        >
          <div className="flex items-center gap-3.5 p-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              {darkMode ? <Moon className="w-5 h-5 text-foreground" /> : <Sun className="w-5 h-5 text-foreground" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{de ? 'Dunkelmodus' : 'Dark Mode'}</p>
              <p className="text-[11px] text-muted-foreground">{de ? 'Augenfreundlich bei Nacht' : 'Easy on the eyes at night'}</p>
            </div>
            <button
              onClick={handleDarkMode}
              className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
                darkMode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all duration-200 ${
                darkMode ? 'left-[22px]' : 'left-0.5'
              }`} />
            </button>
          </div>
        </motion.div>

        {/* Updates */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border/50 p-4 shadow-card"
        >
          <UpdateChecker />
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/50 p-4 shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{de ? 'App-Info' : 'App Info'}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{de ? 'Erstellt von' : 'Built by'}</span>
              <span className="font-medium text-foreground">GWM GmbH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{de ? 'Produkt' : 'Product'}</span>
              <span className="font-medium text-primary">Recycle Solution™</span>
            </div>
          </div>
        </motion.div>

        {/* Storage info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border/50 p-4 shadow-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{de ? 'Speicher' : 'Storage'}</p>
              <p className="text-[11px] text-muted-foreground">12.4 MB {de ? 'verwendet' : 'used'}</p>
            </div>
            <button className="text-xs text-primary font-medium hover:underline">
              {de ? 'Cache leeren' : 'Clear cache'}
            </button>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary/60 rounded-full" style={{ width: '15%' }} />
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Settings;
