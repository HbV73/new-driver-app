import { useState } from 'react';
import { Droplets, Clock, CheckCircle2, ChevronRight, Phone, MapPin, CalendarCheck, PhoneIncoming, Cpu, UserPlus } from 'lucide-react';
import { Visit, VisitSource } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface VisitCardProps {
  visit: Visit;
}

const statusConfig = {
  pending: { dot: 'bg-muted-foreground/40', accent: 'border-l-muted-foreground/20', idBg: 'bg-primary/10', idText: 'text-primary' },
  in_progress: { dot: 'bg-secondary', accent: 'border-l-secondary', idBg: 'bg-secondary/15', idText: 'text-secondary' },
  completed: { dot: 'bg-primary', accent: 'border-l-primary', idBg: 'bg-primary/12', idText: 'text-primary' },
  skipped: { dot: 'bg-destructive', accent: 'border-l-destructive/50', idBg: 'bg-destructive/10', idText: 'text-destructive' },
};

const sourceConfig: Record<VisitSource, { icon: typeof CalendarCheck; bg: string; text: string; key: string }> = {
  scheduled: { icon: CalendarCheck, bg: 'bg-primary/10', text: 'text-primary', key: 'source.scheduled' },
  called: { icon: PhoneIncoming, bg: 'bg-warning/10', text: 'text-warning', key: 'source.called' },
  auto_planned: { icon: Cpu, bg: 'bg-secondary/10', text: 'text-secondary', key: 'source.auto_planned' },
  prospect: { icon: UserPlus, bg: 'bg-success/10', text: 'text-success', key: 'source.prospect' },
};

const SwipeableVisitCard = ({ visit }: VisitCardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${visit.phone}`, '_self');
  };

  const config = statusConfig[visit.status];
  const source = sourceConfig[visit.visitSource];
  const SourceIcon = source.icon;
  const isCompleted = visit.status === 'completed';
  const isSkipped = visit.status === 'skipped';
  const isProspect = visit.visitSource === 'prospect';
  const syncLabel = visit.localSyncStatus === 'failed'
    ? 'Sync fehlgeschlagen'
    : visit.localSyncStatus
      ? 'Offline gespeichert'
      : null;

  return (
    <div
      onClick={() => navigate(isProspect ? `/new-customer?visitId=${visit.id}` : `/visit/${visit.id}`)}
      className={`relative bg-card border border-border/50 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-card-hover border-l-[3px] ${config.accent} ${isCompleted ? 'opacity-50' : ''} ${isSkipped ? 'opacity-35' : ''}`}
    >
      <div className="flex items-center gap-3.5 px-3.5 py-3.5">
        {/* Left: Visit order + Customer ID */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className={`w-12 h-12 rounded-xl ${config.idBg} flex items-center justify-center shadow-sm`}>
            <span className={`text-[17px] font-extrabold ${config.idText}`}>{visit.id}</span>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">#{visit.order}</span>
        </div>

        {/* Middle: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-[15px] font-bold text-foreground truncate leading-snug ${isCompleted ? 'line-through' : ''}`}>
              {visit.customerName}
            </h3>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
          </div>
          {/* Source badge */}
          <div className={`inline-flex items-center gap-1 ${source.bg} px-1.5 py-0.5 rounded-md w-fit mb-1`}>
            <SourceIcon className={`w-3 h-3 ${source.text}`} />
            <span className={`text-[10px] font-semibold ${source.text}`}>{t(source.key as any)}</span>
          </div>
          <p className="text-[12px] text-muted-foreground truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0 text-muted-foreground/50" />
            {visit.address}
          </p>
          <div className="flex items-center gap-3.5 mt-2">
            <div className="flex items-center gap-1.5 bg-primary/6 px-2 py-0.5 rounded-lg">
              <Droplets className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-[12px] font-semibold text-foreground">~{visit.estimatedOilAmount} kg</span>
            </div>
            {visit.scheduledTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-[11px] text-muted-foreground font-medium">{visit.scheduledTime}</span>
              </div>
            )}
          </div>
          {syncLabel && (
            <div className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${
              visit.localSyncStatus === 'failed'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
            }`}>
              {syncLabel}
            </div>
          )}
        </div>

        {/* Right: Phone + Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCall}
            className="w-10 h-10 rounded-full bg-secondary/10 hover:bg-secondary/20 active:scale-95 flex items-center justify-center transition-all shadow-sm"
          >
            <Phone className="w-4.5 h-4.5 text-secondary" />
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
        </div>
      </div>

      {/* Dispatcher note - prominent */}
      {visit.note && (
        <div className="mx-3.5 mb-3 -mt-0.5 ml-[68px] flex items-start gap-2 bg-warning/8 border border-warning/20 rounded-xl px-3 py-2">
          <span className="text-sm leading-none mt-0.5">📋</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-warning uppercase tracking-wide mb-0.5">Disposition</p>
            <p className="text-[11px] text-foreground/80 leading-snug">{visit.note}</p>
          </div>
        </div>
      )}

      {/* Completed info */}
      {isCompleted && visit.collectedOilKg && (
        <div className="px-4 pb-3 pl-[68px] flex items-center gap-1.5 text-[11px] text-primary font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{visit.collectedOilKg} kg gesammelt · {visit.completedAt}</span>
        </div>
      )}
    </div>
  );
};

export default SwipeableVisitCard;
