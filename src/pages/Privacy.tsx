import { motion } from 'framer-motion';
import { Shield, Eye, MapPin, Clock, Trash2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

const Privacy = () => {
  const { lang } = useLanguage();
  const de = lang === 'de';

  const [settings, setSettings] = useState({
    locationSharing: true,
    activityVisible: true,
    dataRetention: '90',
  });

  const toggle = (key: 'locationSharing' | 'activityVisible') => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppLayout>
      <AppHeader title={de ? 'Datenschutz' : 'Privacy'} showBack />
      <div className="px-4 pt-4 pb-4 space-y-4">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-card"
        >
          <div className="flex items-center gap-3.5 p-4 border-b border-border/40">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{de ? 'Standortfreigabe' : 'Location Sharing'}</p>
              <p className="text-[11px] text-muted-foreground">{de ? 'GPS-Position mit Disposition teilen' : 'Share GPS with dispatch'}</p>
            </div>
            <button
              onClick={() => toggle('locationSharing')}
              className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
                settings.locationSharing ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all duration-200 ${
                settings.locationSharing ? 'left-[22px]' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center gap-3.5 p-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Eye className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{de ? 'Aktivität sichtbar' : 'Activity Visible'}</p>
              <p className="text-[11px] text-muted-foreground">{de ? 'Leistungsdaten im Ranking anzeigen' : 'Show performance in ranking'}</p>
            </div>
            <button
              onClick={() => toggle('activityVisible')}
              className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
                settings.activityVisible ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all duration-200 ${
                settings.activityVisible ? 'left-[22px]' : 'left-0.5'
              }`} />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 p-4 shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{de ? 'Datenspeicherung' : 'Data Retention'}</p>
          </div>
          <div className="flex gap-2">
            {['30', '90', '365'].map(d => (
              <button
                key={d}
                onClick={() => setSettings(prev => ({ ...prev, dataRetention: d }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  settings.dataRetention === d
                    ? 'bg-primary text-primary-foreground shadow-brand'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {d} {de ? 'Tage' : 'days'}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button className="w-full flex items-center gap-3.5 p-4 bg-card rounded-2xl border border-destructive/15 hover:bg-destructive/5 transition-colors shadow-card">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-destructive">{de ? 'Daten löschen' : 'Delete Data'}</p>
              <p className="text-[11px] text-muted-foreground">{de ? 'Alle persönlichen Daten entfernen' : 'Remove all personal data'}</p>
            </div>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-2"
        >
          <p className="text-[10px] text-muted-foreground">
            {de ? 'Datenschutz gemäß DSGVO · German Waste Management GmbH' : 'Privacy per GDPR · German Waste Management GmbH'}
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Privacy;
