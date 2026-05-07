import { MapPin, Phone, Droplets, Clock, AlertTriangle } from 'lucide-react';
import { Visit } from '@/types';
import { useNavigate } from 'react-router-dom';

interface VisitCardProps {
  visit: Visit;
}

const statusStyles = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-secondary text-secondary-foreground',
  completed: 'bg-primary text-primary-foreground',
  skipped: 'bg-destructive/20 text-destructive',
};

const statusLabels = {
  pending: 'Ausstehend',
  in_progress: 'In Bearbeitung',
  completed: 'Abgeschlossen',
  skipped: 'Übersprungen',
};

/** Check if current time is past the scheduled time */
const isLate = (scheduledTime?: string): boolean => {
  if (!scheduledTime) return false;
  const now = new Date();
  const [h, m] = scheduledTime.split(':').map(Number);
  const scheduled = new Date();
  scheduled.setHours(h, m, 0, 0);
  return now > scheduled;
};

/** Minutes late */
const minutesLate = (scheduledTime?: string): number => {
  if (!scheduledTime) return 0;
  const now = new Date();
  const [h, m] = scheduledTime.split(':').map(Number);
  const scheduled = new Date();
  scheduled.setHours(h, m, 0, 0);
  const diff = Math.floor((now.getTime() - scheduled.getTime()) / 60000);
  return diff > 0 ? diff : 0;
};

const VisitCard = ({ visit }: VisitCardProps) => {
  const navigate = useNavigate();
  const late = visit.status !== 'completed' && visit.status !== 'skipped' && isLate(visit.scheduledTime);
  const lateMin = late ? minutesLate(visit.scheduledTime) : 0;
  const syncLabel = visit.localSyncStatus === 'failed'
    ? 'Sync fehlgeschlagen'
    : visit.localSyncStatus
      ? 'Offline gespeichert'
      : null;

  return (
    <div
      onClick={() => navigate(`/visit/${visit.id}`)}
      className={`bg-card rounded-lg border p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer animate-slide-up ${
        late ? 'border-destructive/40 ring-1 ring-destructive/20' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{visit.id}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[visit.status]}`}>
            {statusLabels[visit.status]}
          </span>
          {syncLabel && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              visit.localSyncStatus === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            }`}>
              {syncLabel}
            </span>
          )}
        </div>
        {/* Scheduled time badge */}
        {visit.scheduledTime && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            late
              ? 'bg-destructive/10 text-destructive'
              : 'bg-primary/10 text-primary'
          }`}>
            {late ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {visit.scheduledTime}
          </div>
        )}
      </div>

      {/* Late warning banner */}
      {late && lateMin > 0 && (
        <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive text-[11px] font-medium rounded-lg px-2.5 py-1.5 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{lateMin} Min. Verspätung – bitte beeilen!</span>
        </div>
      )}

      <h3 className="text-base font-bold text-foreground mb-1">
        {visit.order}. {visit.customerName}
      </h3>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <MapPin className="w-3 h-3" />
        <span>Adresse: {visit.address}</span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{visit.contactPerson}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{visit.phone}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Vertragspreis: <span className="font-semibold text-foreground">{visit.contractPrice},00 €</span></span>
          <div className="flex items-center gap-1 text-primary">
            <Droplets className="w-3 h-3" />
            <span className="font-semibold">~{visit.estimatedOilAmount} kg Öl</span>
          </div>
        </div>
        {visit.note && (
          <p className="text-[11px] text-muted-foreground mt-1 italic">{visit.note}</p>
        )}
      </div>
    </div>
  );
};

export default VisitCard;
