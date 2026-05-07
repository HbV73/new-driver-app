import { Warehouse, Trash2, Package, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DepotTaskCardProps {
  order: number;
  scheduledTime: string;
  completed?: boolean;
}

const DepotTaskCard = ({ order, scheduledTime, completed = false }: DepotTaskCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/morning')}
      className={`w-full text-left bg-card rounded-2xl border-2 transition-all active:scale-[0.98] overflow-hidden ${
        completed
          ? 'border-primary/20 opacity-70'
          : 'border-dashed border-warning/40 hover:border-warning/60'
      }`}
    >
      {/* Accent strip */}
      <div className={`h-1 w-full ${completed ? 'bg-primary' : 'bg-gradient-to-r from-warning to-destructive/60'}`} />

      <div className="p-3.5 flex items-center gap-3">
        {/* Order number */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
          completed
            ? 'bg-primary/10 text-primary'
            : 'bg-warning/10 text-warning'
        }`}>
          {completed ? <Check className="w-5 h-5" /> : order}
        </div>

        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          completed ? 'bg-primary/10' : 'bg-warning/10'
        }`}>
          <Warehouse className={`w-5 h-5 ${completed ? 'text-primary' : 'text-warning'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold truncate ${completed ? 'text-muted-foreground' : 'text-foreground'}`}>
              Lager – Entleerung & Beladen
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Industrieweg 5, Hannover</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-warning/10 text-warning px-2 py-0.5 rounded-full">
              <Trash2 className="w-3 h-3" /> Entleerung
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Package className="w-3 h-3" /> Beladen
            </span>
          </div>
        </div>

        {/* Time & arrow */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">{scheduledTime}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </div>
    </button>
  );
};

export default DepotTaskCard;
