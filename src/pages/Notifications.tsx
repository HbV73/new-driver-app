import { motion } from 'framer-motion';
import { Bell, BellOff, Volume2, Smartphone, MessageSquare } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

const Notifications = () => {
  const { lang } = useLanguage();
  const de = lang === 'de';

  const [settings, setSettings] = useState({
    push: true,
    sound: true,
    newMessage: true,
    tourUpdate: true,
    safety: true,
    performance: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const items = [
    { key: 'push' as const, icon: Smartphone, label: de ? 'Push-Benachrichtigungen' : 'Push Notifications', sub: de ? 'Benachrichtigungen auf dem Gerät' : 'Notifications on device' },
    { key: 'sound' as const, icon: Volume2, label: de ? 'Ton' : 'Sound', sub: de ? 'Benachrichtigungstöne abspielen' : 'Play notification sounds' },
    { key: 'newMessage' as const, icon: MessageSquare, label: de ? 'Neue Nachrichten' : 'New Messages', sub: de ? 'Nachrichten vom Disponenten' : 'Messages from dispatcher' },
    { key: 'tourUpdate' as const, icon: Bell, label: de ? 'Tour-Änderungen' : 'Tour Changes', sub: de ? 'Änderungen an deiner Tour' : 'Changes to your tour' },
    { key: 'safety' as const, icon: Bell, label: de ? 'Sicherheitshinweise' : 'Safety Tips', sub: de ? 'Tägliche Sicherheitstipps' : 'Daily safety tips' },
    { key: 'performance' as const, icon: Bell, label: de ? 'Leistungsupdates' : 'Performance Updates', sub: de ? 'Wöchentliche Zusammenfassung' : 'Weekly summary' },
  ];

  return (
    <AppLayout>
      <AppHeader title={de ? 'Benachrichtigungen' : 'Notifications'} showBack />
      <div className="px-4 pt-4 pb-4 space-y-1">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
              <button
                onClick={() => toggle(item.key)}
                className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
                  settings[item.key] ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all duration-200 ${
                  settings[item.key] ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Notifications;
