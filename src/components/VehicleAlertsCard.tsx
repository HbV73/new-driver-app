import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Calendar, Droplet, Snowflake, Shield, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVehicleAlerts, type VehicleAlert } from '@/hooks/useVehicleAlerts';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const ICON_MAP: Record<string, typeof Wrench> = {
  tuv: Calendar,
  service: Wrench,
  oil_change: Droplet,
  tires: Snowflake,
  insurance: Shield,
  inspection_defect: AlertTriangle,
  other: AlertTriangle,
};

const SEVERITY_STYLES = {
  critical: 'bg-destructive/10 border-destructive/40 text-destructive',
  warning: 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400',
  info: 'bg-primary/10 border-primary/30 text-primary',
};

const VehicleAlertsCard = () => {
  const { vehicle, alerts, dismiss } = useVehicleAlerts();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!vehicle || alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border/60 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          {t('vehicle.alerts.title')}
        </h3>
        <span className="text-xs text-muted-foreground">{vehicle.license_plate}</span>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {alerts.slice(0, 3).map((alert: VehicleAlert) => {
            const Icon = ICON_MAP[alert.alert_type] ?? AlertTriangle;
            const tKey = `vehicle.alert.${alert.alert_type}` as Parameters<typeof t>[0];
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`rounded-xl border p-3 ${SEVERITY_STYLES[alert.severity]}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    {alert.due_date && (
                      <p className="text-xs opacity-80 mt-0.5">
                        {new Date(alert.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => void dismiss(alert.id)}
                    aria-label={t('vehicle.dismiss')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {alerts.length > 3 && (
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/notifications')}>
          +{alerts.length - 3} weitere
        </Button>
      )}
    </motion.div>
  );
};

export default VehicleAlertsCard;
