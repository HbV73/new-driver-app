import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Droplets, Truck, Navigation, Check, Circle, Loader2, QrCode, Gauge, Warehouse, Coffee, LogIn, LogOut, Timer, RefreshCw } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTodayRoute } from '@/hooks/useTodayRoute';

const TourOverview = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { routeData, stops, summary, dailySummary, loading, error, isEmpty, refresh } = useTodayRoute();
  const visits = stops.map((stop) => stop.uiVisit);
  const today = new Date();
  const dateStr = today.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = today.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const company = { name: 'GWM GmbH' };
  const driver = {
    name: profile?.full_name || 'Max Mustermann',
    licensePlate: profile?.license_plate || 'H-GW 1042',
  };

  const totalEstimatedKg = summary?.estimatedOilKg ?? 0;
  const completedCount = summary?.completedStops ?? 0;
  const routeId = routeData?.route.route_code ?? '—';
  const startAddress = routeData?.route.start_address ?? '—';
  const endAddress = routeData?.route.end_address ?? routeData?.route.start_address ?? '—';
  const startLabel = routeData?.route.start_address ? 'Start' : 'Depot';
  const startTime = dailySummary?.startTime ?? '—';
  const estimatedEndTime = dailySummary?.estimatedEndTime ?? '—';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-3 h-3" />;
      case 'in_progress': return <Loader2 className="w-3 h-3 animate-spin" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'in_progress': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('tour.done');
      case 'in_progress': return t('tour.inProgress');
      default: return t('tour.planned');
    }
  };

  return (
    <AppLayout>
      <AppHeader title={t('tour.overviewTitle')} showBack />

      <div className="px-4 py-4 pb-28 space-y-3">
        {/* 1. Header - Police sees this first */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-4 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide">Tourenübersicht</h2>
            <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{dateStr}</span>
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">{t('tour.company')}</p>
              <p className="font-bold text-foreground">{company.name}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">{t('tour.driver')}</p>
              <p className="font-bold text-foreground">{driver.name}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">{t('tour.plate')}</p>
              <p className="font-bold text-foreground">{driver.licensePlate}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">{t('tour.purpose')}</p>
              <p className="font-bold text-foreground text-[11px]">Sammlung von Altspeiseöl</p>
            </div>
          </div>
        </motion.div>

        {(loading || error || isEmpty) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-card text-center"
          >
            {loading && (
              <>
                <p className="text-sm font-bold text-foreground">Tour wird geladen</p>
                <p className="text-xs text-muted-foreground mt-1">Die heutige Route wird aus Supabase geladen.</p>
              </>
            )}
            {error && (
              <>
                <p className="text-sm font-bold text-destructive">Tour konnte nicht geladen werden</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <button onClick={() => void refresh()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Erneut versuchen
                </button>
              </>
            )}
            {isEmpty && (
              <>
                <p className="text-sm font-bold text-foreground">Keine Tour für heute</p>
                <p className="text-xs text-muted-foreground mt-1">Sobald die Disposition eine Route zuweist, erscheint sie hier.</p>
              </>
            )}
          </motion.div>
        )}

        {/* 2. Route summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          <div className="bg-card rounded-xl border border-border p-3 text-center shadow-card">
            <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground">{summary?.totalStops ?? 0}</p>
            <p className="text-[9px] text-muted-foreground">{t('tour.totalStops')}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center shadow-card">
            <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-sm font-extrabold text-foreground">{startTime}–{estimatedEndTime}</p>
            <p className="text-[9px] text-muted-foreground">{t('tour.duration')}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center shadow-card">
            <Droplets className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground">{totalEstimatedKg}</p>
            <p className="text-[9px] text-muted-foreground">kg {t('tour.estimated')}</p>
          </div>
        </motion.div>

        {/* 3. Customer list with warehouse + break */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">{t('tour.customerList')}</h3>
            <span className="text-[10px] text-primary font-semibold">{completedCount}/{summary?.totalStops ?? 0} {t('done')}</span>
          </div>

          <div className="divide-y divide-border/30">
            {/* Warehouse departure */}
            <div className="px-4 py-3 flex items-center gap-3 bg-primary/3">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Warehouse className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary">{startLabel}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />{startAddress}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="text-[10px] font-semibold text-primary">{startTime}</span>
                <span className="inline-flex items-center gap-0.5 text-[9px] text-primary/70">
                  <LogOut className="w-2.5 h-2.5" /> {t('tour.departureFrom')}
                </span>
              </div>
            </div>

            {visits.map((visit) => (
              <div key={visit.id}>
                <div className="px-4 py-3 flex items-start gap-3">
                  {/* Order + status */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusStyle(visit.status)}`}>
                    {visit.status === 'completed' ? getStatusIcon(visit.status) : (
                      <span className="text-[11px] font-bold">{visit.order}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{visit.customerName}</p>
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${getStatusStyle(visit.status)}`}>
                        {getStatusLabel(visit.status)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" />{visit.address}
                    </p>
                    {visit.note && (
                      <p className="text-[9px] text-muted-foreground/70 italic mt-0.5">📝 {visit.note}</p>
                    )}
                    {/* Time details for completed visits */}
                    {visit.status === 'completed' && visit.completedAt && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-primary/8 text-primary px-1.5 py-0.5 rounded-md">
                          <LogIn className="w-2.5 h-2.5" />
                          {visit.scheduledTime}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-md">
                          <Timer className="w-2.5 h-2.5" />
                          {(() => {
                            if (!visit.scheduledTime || !visit.completedAt) return '—';
                            const [sh, sm] = visit.scheduledTime.split(':').map(Number);
                            const [eh, em] = visit.completedAt.split(':').map(Number);
                            return `${(eh * 60 + em) - (sh * 60 + sm)} Min`;
                          })()}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                          <LogOut className="w-2.5 h-2.5" />
                          {visit.completedAt}
                        </span>
                      </div>
                    )}
                    {visit.status === 'in_progress' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-primary/8 text-primary px-1.5 py-0.5 rounded-md">
                          <LogIn className="w-2.5 h-2.5" />
                          {visit.scheduledTime}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md animate-pulse">
                          {t('tour.onSite')}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{visit.scheduledTime}</span>
                </div>

                {/* Pflichtpause after visit 3 */}
                {visit.order === 3 && (
                  <div
                    onClick={() => navigate('/break')}
                    className="px-4 py-2.5 flex items-center gap-3 bg-amber-50/50 border-y border-amber-200/30 cursor-pointer hover:bg-amber-50/80 active:scale-[0.99] transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-300/40">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-700">{t('tour.mandatoryBreak')}</p>
                      <p className="text-[9px] text-amber-600/70">{t('tour.legalRest')}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-600">60 Min →</span>
                  </div>
                )}
              </div>
            ))}

            {/* Return to warehouse */}
            <div className="px-4 py-3 flex items-center gap-3 bg-muted/30">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{t('route.returnToWarehouse')}</p>
                <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />{endAddress}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="text-[10px] font-medium text-muted-foreground">{estimatedEndTime}</span>
                <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground/70">
                  <LogIn className="w-2.5 h-2.5" /> {t('tour.arrivalAt')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. Kilometer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-4 shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">{t('tour.kilometer')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground uppercase">{t('tour.startKm')}</p>
              <p className="text-sm font-bold text-muted-foreground">--</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground uppercase">{t('tour.currentKm')}</p>
              <p className="text-sm font-bold text-muted-foreground">--</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground uppercase">{t('tour.endKm')}</p>
              <p className="text-sm font-bold text-muted-foreground">--</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            Kilometerwerte erscheinen hier nach echter Tacho-/Fahrtenbuch-Synchronisierung.
          </p>
        </motion.div>

        {/* 5. Digital proof */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-4 shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">{t('tour.digitalProof')}</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase">{t('tour.routeId')}</p>
              <p className="text-[10px] font-mono font-bold text-foreground break-all">{routeId}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase">Timestamp</p>
              <p className="text-[10px] font-mono font-bold text-foreground">{timeStr} Uhr</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase">GPS</p>
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3 text-muted-foreground" />
                <p className="text-[10px] font-bold text-muted-foreground">Nicht im Nachweis aktiv</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-center">
              <div
                className="w-12 h-12 border-2 border-dashed border-border rounded-lg flex items-center justify-center"
                title="QR-Nachweis ist noch nicht mit dem Backend verbunden"
              >
                <QrCode className="w-6 h-6 text-muted-foreground/40" />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            Digitaler QR-/GPS-Nachweis ist fuer QA sichtbar, aber noch nicht backendseitig verbunden.
          </p>
        </motion.div>

        {/* Footer */}
        <p className="text-[9px] text-muted-foreground/50 text-center px-4 pt-2">
          {t('driverID.footer')}
        </p>
      </div>
    </AppLayout>
  );
};

export default TourOverview;
