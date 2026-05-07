import { motion } from 'framer-motion';
import { FileText, Clock, MapPin, Truck, Download, Droplets, Coffee, Eye, RefreshCw } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { SmartRouteCard } from '@/components/SmartRouteCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTodayRoute } from '@/hooks/useTodayRoute';

// System assigns break after visit #3 (index 2)
const BREAK_AFTER_VISIT_ORDER = 3;
const BREAK_DURATION_MIN = 60;
const BREAK_TIME = '10:30';

const TourPlan = () => {
  const { t, lang } = useLanguage();
  const { stops, summary, dailySummary, loading, error, isEmpty, refresh } = useTodayRoute();
  const visits = stops.map((stop) => stop.uiVisit);
  const now = new Date();
  const locale = lang === 'de' ? 'de-DE' : 'en-US';
  const dateStr = now.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const startTime = dailySummary?.startTime ?? '—';
  const estimatedEndTime = dailySummary?.estimatedEndTime ?? '—';

  return (
    <AppLayout>
      <AppHeader title={t('tourPlan.title')} showBack />

      <div className="px-4 pt-4 pb-4 space-y-5">
        {/* Tracking notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/15 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
        >
          <Eye className="w-4 h-4 text-primary shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">{t('gps.trackingInfo')}</span> — {t('gps.trackingInfoSub')}
          </p>
        </motion.div>

        {(loading || error || isEmpty) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-4 text-center"
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

        <SmartRouteCard
          visits={stops.map(stop => ({
            id: stop.id,
            customerName: stop.customerName,
            address: stop.address,
            lat: stop.lat,
            lng: stop.lng,
            estimatedOilKg: stop.estimatedOilAmount,
            scheduledTime: stop.scheduledTime,
          }))}
        />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{t('tourPlan.daily')}</p>
              <p className="text-xs text-muted-foreground">{dateStr}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="text-center bg-muted/50 rounded-lg p-2.5">
              <Clock className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-[10px] text-muted-foreground">{t('tourPlan.start')}</p>
              <p className="text-sm font-bold text-foreground">{startTime}</p>
            </div>
            <div className="text-center bg-muted/50 rounded-lg p-2.5">
              <Truck className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-[10px] text-muted-foreground">{t('tourPlan.stops')}</p>
              <p className="text-sm font-bold text-foreground">{summary?.totalStops ?? 0}</p>
            </div>
            <div className="text-center bg-secondary/10 rounded-lg p-2.5">
              <Coffee className="w-4 h-4 mx-auto text-secondary mb-1" />
              <p className="text-[10px] text-muted-foreground">Pause</p>
              <p className="text-sm font-bold text-secondary">{BREAK_DURATION_MIN} min</p>
            </div>
            <div className="text-center bg-muted/50 rounded-lg p-2.5">
              <Clock className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-[10px] text-muted-foreground">{t('tourPlan.endApprox')}</p>
              <p className="text-sm font-bold text-foreground">{estimatedEndTime}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{t('tourPlan.routeLog')}</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-[10px] font-semibold text-muted-foreground px-3 py-2">#</th>
                  <th className="text-[10px] font-semibold text-muted-foreground px-3 py-2">{t('tourPlan.time')}</th>
                  <th className="text-[10px] font-semibold text-muted-foreground px-3 py-2">{t('tourPlan.customer')}</th>
                  <th className="text-[10px] font-semibold text-muted-foreground px-3 py-2 text-right">kg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visits.map((visit) => (
                  <>
                    <tr key={visit.id} className={visit.status === 'completed' ? 'bg-primary/5' : ''}>
                      <td className="text-xs font-medium text-foreground px-3 py-2.5">{visit.order}</td>
                      <td className="text-xs text-muted-foreground px-3 py-2.5">{visit.scheduledTime}</td>
                      <td className="text-xs text-foreground px-3 py-2.5">
                        <p className="font-medium truncate max-w-[140px]">{visit.customerName}</p>
                        {visit.localSyncStatus && (
                          <p className={`text-[9px] font-semibold mt-0.5 ${
                            visit.localSyncStatus === 'failed' ? 'text-destructive' : 'text-primary'
                          }`}>
                            {visit.localSyncStatus === 'failed' ? 'Sync fehlgeschlagen' : 'Offline gespeichert'}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />{visit.address}
                        </p>
                      </td>
                      <td className="text-xs font-medium px-3 py-2.5 text-right">
                        <span className="flex items-center justify-end gap-1 text-primary">
                          <Droplets className="w-3 h-3" />{visit.collectedOilKg || visit.estimatedOilAmount}
                        </span>
                      </td>
                    </tr>
                    {/* System-assigned break row */}
                    {visit.order === BREAK_AFTER_VISIT_ORDER && (
                      <tr key="break" className="bg-secondary/8">
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-base">☕</span>
                        </td>
                        <td className="text-xs font-semibold text-secondary px-3 py-2.5">{BREAK_TIME}</td>
                        <td className="text-xs px-3 py-2.5" colSpan={2}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-secondary">Pflichtpause</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Systemzuweisung · {BREAK_DURATION_MIN} Minuten
                              </p>
                            </div>
                            <span className="text-[9px] font-semibold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                              {BREAK_DURATION_MIN} min
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Break info card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-secondary/5 border border-secondary/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Deine Pause heute</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                Das System hat deine <strong className="text-secondary">{BREAK_DURATION_MIN}-Minuten-Pause</strong> nach Kunde #{BREAK_AFTER_VISIT_ORDER} um <strong className="text-secondary">{BREAK_TIME} Uhr</strong> eingeplant. Die Pausenzeit wird automatisch überwacht und dokumentiert.
              </p>
              <div className="flex items-center gap-4 mt-2.5">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Clock className="w-3 h-3 text-secondary" />
                  <span className="text-muted-foreground">Beginn:</span>
                  <span className="font-bold text-foreground">{BREAK_TIME}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Clock className="w-3 h-3 text-secondary" />
                  <span className="text-muted-foreground">Ende:</span>
                  <span className="font-bold text-foreground">11:30</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <Button variant="outline" disabled className="w-full h-12 opacity-60 cursor-not-allowed">
          <Download className="w-5 h-5 mr-2" /> {t('tourPlan.downloadPdf')} (noch nicht verbunden)
        </Button>
      </div>
    </AppLayout>
  );
};

export default TourPlan;
