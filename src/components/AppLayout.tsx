import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <div className="pb-20">
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
