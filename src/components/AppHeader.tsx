import { ArrowLeft, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import NetworkPattern from './NetworkPattern';
import OfflineIndicator from './OfflineIndicator';
import NotificationBell from './NotificationBell';
import logoApp from '@/assets/logo-app.png';

export interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  rightContent?: React.ReactNode;
  onBack?: () => void;
}

const AppHeader = ({ title, showBack, showMenu, rightContent, onBack }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-brand text-primary-foreground overflow-hidden">
      {/* Network pattern overlay — same motif as logo */}
      <NetworkPattern
        color="rgba(255,255,255,1)"
        opacity={0.1}
        animate
        nodeCount={16}
      />

      <div className="relative flex items-center justify-between px-3 py-2.5 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          {showBack && (
            <button onClick={handleBack} className="p-1.5 -ml-1 rounded-xl hover:bg-white/15 active:bg-white/20 transition-all duration-200">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {showMenu && (
            <button onClick={() => navigate('/menu')} className="p-1.5 -ml-1 rounded-xl hover:bg-white/15 active:bg-white/20 transition-all duration-200">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <img
              src={logoApp}
              alt="Recycle Solution"
              className="w-9 h-9 object-contain drop-shadow-md"
            />
            <h1 className="text-[17px] font-bold tracking-tight truncate drop-shadow-sm">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <OfflineIndicator />
          <NotificationBell />
          {rightContent}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
