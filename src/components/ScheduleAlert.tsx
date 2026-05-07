import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Visit } from '@/types';

interface ScheduleAlertProps {
  visits: Visit[];
}

const ScheduleAlert = ({ visits }: ScheduleAlertProps) => {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<{ visitId: number; customerName: string; scheduledTime: string; minutesLate: number }[]>([]);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const newAlerts = visits
        .filter(v => v.status === 'pending' || v.status === 'in_progress')
        .filter(v => v.scheduledTime)
        .map(v => {
          const [h, m] = v.scheduledTime!.split(':').map(Number);
          const scheduled = new Date();
          scheduled.setHours(h, m, 0, 0);
          const diff = Math.floor((now.getTime() - scheduled.getTime()) / 60000);
          return { visitId: v.id, customerName: v.customerName, scheduledTime: v.scheduledTime!, minutesLate: diff };
        })
        .filter(a => a.minutesLate > 5 && !dismissed.includes(`${a.visitId}`));
      setAlerts(newAlerts);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [visits, dismissed]);

  if (alerts.length === 0) return null;

  // Show top alert only
  const alert = alerts[0];

  return (
    <AnimatePresence>
      <motion.div
        key={alert.visitId}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mx-4 mb-2"
      >
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-destructive/15 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-destructive">
              {alert.minutesLate} Min. hinter dem Zeitplan!
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {alert.customerName} · geplant {alert.scheduledTime}
            </p>
            {alerts.length > 1 && (
              <p className="text-[10px] text-destructive/70 mt-0.5">
                +{alerts.length - 1} weitere verspätete Besuche
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed(prev => [...prev, `${alert.visitId}`])}
            className="p-1 rounded-full hover:bg-destructive/10 shrink-0"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleAlert;
