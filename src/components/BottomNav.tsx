import { Truck, Navigation, Package, IdCard, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navItems = [
    { path: '/', label: t('nav.tour'), icon: Truck },
    { path: '/route', label: t('nav.route'), icon: Navigation },
    { path: '/work-time', label: t('nav.workTime'), icon: Clock },
    { path: '/inventory', label: t('nav.storage'), icon: Package },
    { path: '/driver-id', label: t('nav.driverID'), icon: IdCard },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/85 backdrop-blur-xl border-t border-border/40 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-1 py-1.5 px-6 transition-all duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1.5 w-10 h-1 bg-primary rounded-full shadow-brand"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
