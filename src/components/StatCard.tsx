import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'primary' | 'accent';
}

const StatCard = ({ icon: Icon, label, value, subtext, variant = 'default' }: StatCardProps) => {
  const styles = {
    default: 'bg-card border border-border',
    primary: 'bg-primary/10 border border-primary/20',
    accent: 'bg-secondary/10 border border-secondary/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    accent: 'text-secondary',
  };

  return (
    <div className={`rounded-lg p-3 ${styles[variant]} animate-slide-up`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${iconStyles[variant]}`} />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {subtext && <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  );
};

export default StatCard;
