import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Clock, Fuel, MessageSquare, FileText, User,
  ChevronRight, Phone, CalendarDays, LogOut, ArrowLeft, Globe, Sunrise, UserPlus, AlertTriangle, Shield, QrCode
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import NetworkPattern from '@/components/NetworkPattern';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import logoApp from '@/assets/logo-app.png';
import logoCompany from '@/assets/logo-company.png';
import IncidentReporter from '@/components/IncidentReporter';

const MenuPage = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [showProblem, setShowProblem] = useState(false);

  const menuSections = [
    {
      title: t('menu.work'),
      items: [
        { path: '/work-time', label: t('menu.workTime'), description: t('menu.workTimeSub'), icon: Clock, color: 'bg-primary/10 text-primary' },
        { path: '/morning', label: t('menu.morningFlow'), description: t('menu.morningFlowSub'), icon: Sunrise, color: 'bg-secondary/10 text-secondary' },
        { path: '/tour-plan', label: t('menu.tourPlan'), description: t('menu.tourPlanSub'), icon: FileText, color: 'bg-muted text-muted-foreground' },
        { path: '/scan', label: 'Scanner-Test', description: 'QA-Hilfsseite fuer QR- und Fototest', icon: QrCode, color: 'bg-primary/10 text-primary' },
        { path: '/new-customer', label: t('menu.newCustomer'), description: t('menu.newCustomerSub'), icon: UserPlus, color: 'bg-success/10 text-success' },
        { path: 'problem', label: t('menu.reportProblem'), description: t('menu.reportProblemSub'), icon: AlertTriangle, color: 'bg-destructive/10 text-destructive', action: 'problem' },
        { path: '/fahrernachweis', label: t('fn.menuLabel'), description: t('fn.menuSub'), icon: Shield, color: 'bg-primary/10 text-primary' },
      ],
    },
    {
      title: t('menu.communication'),
      items: [
        { path: '/messages', label: t('menu.messages'), description: t('menu.messagesSub'), icon: MessageSquare, color: 'bg-primary/10 text-primary', badge: 1 },
        { path: 'whatsapp', label: t('menu.whatsapp'), description: t('menu.whatsappSub'), icon: Phone, color: 'bg-success/10 text-success', external: true },
      ],
    },
    {
      title: t('menu.admin'),
      items: [
        { path: '/leave', label: t('menu.leave'), description: t('menu.leaveSub'), icon: CalendarDays, color: 'bg-secondary/10 text-secondary' },
        { path: '/expenses', label: t('menu.fuel'), description: t('menu.fuelSub'), icon: Fuel, color: 'bg-warning/10 text-warning' },
        { path: '/performance', label: t('menu.performance'), description: t('menu.performanceSub'), icon: BarChart3, color: 'bg-primary/10 text-primary' },
        { path: '/profile', label: t('menu.profile'), description: t('menu.profileSub'), icon: User, color: 'bg-muted text-muted-foreground' },
      ],
    },
  ];

  const handleClick = (item: typeof menuSections[0]['items'][0]) => {
    if ('external' in item && item.external) {
      window.open('https://wa.me/4951112345678', '_blank');
      return;
    }
    if ('action' in item && item.action === 'problem') {
      setShowProblem(true);
      return;
    }
    navigate(item.path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-gradient-brand text-primary-foreground overflow-hidden">
        <NetworkPattern color="rgba(255,255,255,1)" opacity={0.08} animate nodeCount={14} />
        <div className="relative flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 -ml-1 rounded-xl hover:bg-white/15 transition-all duration-200">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <img src={logoApp} alt="Recycle Solution" className="w-9 h-9 object-contain drop-shadow-md" />
              <h1 className="text-[17px] font-bold tracking-tight">{t('menu')}</h1>
            </div>
          </div>
        </div>
      </header>


      <div className="px-4 pt-4 pb-4 space-y-4">
        {menuSections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.08 }}
          >
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
              {section.title}
            </h3>
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50 shadow-card">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-all duration-200 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.description}</p>
                    </div>
                    {'badge' in item && item.badge ? (
                      <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {item.badge}
                      </span>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Language switcher */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-card">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">{t('profile.language')}</p>
              </div>
              <div className="flex rounded-full border border-border/60 overflow-hidden">
                {(['de', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                      lang === l
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-card rounded-2xl border border-destructive/15 hover:bg-destructive/5 active:bg-destructive/10 transition-all duration-200 text-left shadow-card"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/10 text-destructive">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-destructive">{t('menu.logout')}</p>
              <p className="text-[11px] text-muted-foreground">{t('menu.logoutSub')}</p>
            </div>
          </button>
        </motion.div>
      </div>

      <IncidentReporter
        open={showProblem}
        onOpenChange={setShowProblem}
        onSubmit={(type, note, delay) => console.log('Incident:', type, note, delay)}
      />
    </AppLayout>
  );
};

export default MenuPage;
