import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, BarChart3, Settings, LogOut, ChevronRight, Shield, Bell, MapPin, Phone, Mail, Globe, Building2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import logoCompany from '@/assets/logo-company.png';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NetworkPattern from '@/components/NetworkPattern';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [licensePlate, setLicensePlate] = useState(profile?.license_plate || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, license_plate: licensePlate })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error(t('saveError'));
    } else {
      toast.success(t('saved'));
      await refreshProfile();
      setEditing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: BarChart3, label: t('profile.myPerformance'), sub: 'Statistiken & Abzeichen', path: '/performance' },
    { icon: Bell, label: t('profile.notifications'), sub: 'Push & In-App', path: '/notifications' },
    { icon: Shield, label: t('profile.privacy'), sub: 'Privatsphäre', path: '/privacy' },
    { icon: Settings, label: t('profile.settings'), sub: 'App-Konfiguration', path: '/settings' },
  ];

  return (
    <AppLayout>
      <AppHeader title={t('profile.title')} showBack />

      <div className="px-4 pt-6 space-y-5">
        {/* Avatar card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t('profile.name')}</label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t('profile.phone')}</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t('profile.plate')}</label>
                <Input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-brand rounded-xl">
                  {saving ? t('profile.saving') : t('profile.save')}
                </Button>
                <Button onClick={() => setEditing(false)} variant="outline" className="rounded-xl">
                  {t('profile.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-16 h-16 rounded-2xl object-cover shadow-card" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{profile?.full_name || t('driver')}</h2>
                <p className="text-xs text-muted-foreground">
                  {user?.email} · {profile?.region || 'Hannover'}
                </p>
                {profile?.license_plate && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">🚛 {profile.license_plate}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <img src={logoCompany} alt="GWM" className="w-4 h-4 rounded-sm object-contain" />
                  <span className="text-[11px] text-muted-foreground">German Waste Management GmbH</span>
                </div>
              </div>
              <button onClick={() => setEditing(true)} className="text-xs text-primary font-medium hover:underline">
                {t('profile.edit')}
              </button>
            </div>
          )}
        </motion.div>

        {/* Menu items */}
        <div className="space-y-1">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <item.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-destructive/5 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-sm font-medium text-destructive">{t('menu.logout')}</p>
        </motion.button>

        {/* Company info footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden bg-gradient-brand rounded-2xl p-5 text-primary-foreground"
        >
          <NetworkPattern color="rgba(255,255,255,1)" opacity={0.06} animate nodeCount={10} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <img src={logoCompany} alt="GWM" className="w-8 h-8 rounded-lg object-contain bg-white/15 p-1" />
              <div>
                <h3 className="text-sm font-bold">German Waste Management GmbH</h3>
                <p className="text-[10px] opacity-70 italic tracking-wide">Beyond Collection</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span className="text-[12px] opacity-90">Heinrichswinkel 14, 38448 Wolfsburg</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <a href="tel:+4938841757000" className="text-[12px] opacity-90 hover:opacity-100">+49 3884 175 7000</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <a href="mailto:support@germanwm.de" className="text-[12px] opacity-90 hover:opacity-100">support@germanwm.de</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <a href="https://germanwm.de" target="_blank" rel="noopener noreferrer" className="text-[12px] opacity-90 hover:opacity-100">germanwm.de</a>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/15">
              <p className="text-[10px] opacity-50 text-center">
                Recycle Solution™ · © {new Date().getFullYear()} GWM GmbH
              </p>
            </div>
          </div>
        </motion.div>

        <div className="h-2" />
      </div>
    </AppLayout>
  );
};

export default Profile;
