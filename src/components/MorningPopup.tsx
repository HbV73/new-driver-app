import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Coffee, Truck, Droplets, Route, ChevronDown, Wind, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NetworkPattern from '@/components/NetworkPattern';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTodayRoute } from '@/hooks/useTodayRoute';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MorningPopup = ({ onClose }: { onClose: () => void }) => {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [step, setStep] = useState(0);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const { routeData, stops, summary: routeSummary, dailySummary, loading, error, isEmpty, refresh } = useTodayRoute();

  const visits = stops.map((stop) => stop.uiVisit);
  const plannedStartTime = dailySummary?.startTime ?? routeSummary?.startTime ?? '08:00';
  const plannedEndTime = dailySummary?.estimatedEndTime ?? routeSummary?.estimatedEndTime ?? '14:30';
  const estimatedOilKg = routeSummary?.estimatedOilKg ?? dailySummary?.estimatedOilKg ?? 0;
  const expectedContainers = routeSummary?.expectedContainers ?? dailySummary?.totalContainers ?? 0;
  const expectedProducts = routeSummary?.expectedProducts ?? dailySummary?.totalProducts ?? 0;
  const routeCode = routeData?.route.route_code ?? '—';
  const startAddress = routeData?.route.start_address ?? t('mp.departure');
  const endAddress = routeData?.route.end_address ?? routeData?.route.start_address ?? t('mp.returnDepot');
  
  const cities = [...new Set(visits.map(v => {
    const parts = v.address.split(',');
    return parts[parts.length - 1]?.trim() || '';
  }).filter(Boolean))];

  const totalHours = plannedStartTime && plannedEndTime
    ? (() => {
        const [sh, sm] = plannedStartTime.split(':').map(Number);
        const [eh, em] = plannedEndTime.split(':').map(Number);
        const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        return Number.isFinite(hours) && hours > 0 ? hours : 6.5;
      })()
    : 6.5;

  const breakMinutes = totalHours > 6 ? 45 : totalHours > 4 ? 30 : 15;
  const breakTime = (() => {
    const [sh, sm] = (plannedStartTime || '08:00').split(':').map(Number);
    const breakAfterMin = Math.min(4 * 60, Math.floor((totalHours * 60) / 2));
    const breakH = Math.floor((sh * 60 + sm + breakAfterMin) / 60);
    const breakM = (sh * 60 + sm + breakAfterMin) % 60;
    return `${String(breakH).padStart(2, '0')}:${String(breakM).padStart(2, '0')}`;
  })();

  const weatherForecast = [
    { time: '08:00', temp: 8, icon: '⛅', wind: 12 },
    { time: '10:00', temp: 11, icon: '☀️', wind: 8 },
    { time: '12:00', temp: 14, icon: '☀️', wind: 10 },
    { time: '14:00', temp: 12, icon: '🌧️', wind: 22 },
    { time: '16:00', temp: 10, icon: '🌧️', wind: 18 },
  ];
  const currentWeather = weatherForecast[0];

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
    }).setView([52.3759, 9.732], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const coords: L.LatLngExpression[] = [];

    stops.forEach((stop) => {
      if (typeof stop.lat !== 'number' || typeof stop.lng !== 'number') return;
      const visit = stop.uiVisit;
      const pos: L.LatLngExpression = [stop.lat, stop.lng];
      coords.push(pos);

      const bg = visit.status === 'completed' ? 'hsl(145,63%,32%)' : 'hsl(var(--muted))';
      const color = visit.status === 'completed' ? '#fff' : '#333';

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${visit.order}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker(pos, { icon }).addTo(map);
    });

    if (coords.length > 1) {
      L.polyline(coords, { color: 'hsl(145,63%,32%)', weight: 3, opacity: 0.6, dashArray: '6 4' }).addTo(map);
      map.fitBounds(L.latLngBounds(coords), { padding: [20, 20] });
    }

    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [stops]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide rounded-t-3xl sm:rounded-3xl shadow-2xl relative"
        >
          <div className="relative overflow-hidden rounded-t-3xl sm:rounded-t-3xl bg-gradient-to-br from-primary to-primary/80 px-5 pt-6 pb-5 text-primary-foreground">
            <NetworkPattern className="opacity-15" nodeCount={12} animate color="white" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-10"
            >
              <p className="text-xs opacity-80 font-medium">{t('mp.goodMorning')}</p>
              <h2 className="text-xl font-extrabold mt-1">{t('mp.dayOverview')}</h2>
              <p className="text-[11px] opacity-70 mt-1.5 tracking-wide uppercase">Beyond Collection</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-3 relative z-10"
            >
              <button
                onClick={() => setWeatherExpanded(!weatherExpanded)}
                className="w-full flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 transition-colors hover:bg-white/15"
              >
                <span className="text-2xl">{currentWeather.icon}</span>
                <span className="text-sm font-bold">{currentWeather.temp}°C</span>
                <span className="text-[10px] opacity-70">{t('mp.cloudy')}</span>
                <ChevronDown className={`w-3.5 h-3.5 ml-auto opacity-60 transition-transform ${weatherExpanded ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {weatherExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between mt-2 bg-white/10 rounded-xl px-3 py-2.5">
                      {weatherForecast.map((w, i) => (
                        <div key={i} className="text-center flex-1">
                          <p className="text-[9px] opacity-60">{w.time}</p>
                          <p className="text-base leading-tight mt-0.5">{w.icon}</p>
                          <p className="text-[11px] font-bold mt-0.5">{w.temp}°</p>
                          <p className="text-[8px] opacity-50 flex items-center justify-center gap-0.5 mt-0.5">
                            <Wind className="w-2 h-2" />{w.wind}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="h-40 relative"
          >
            <div ref={mapRef} className="h-full w-full" />
            <div className="absolute bottom-2 left-3 z-[1000] bg-card/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[10px] font-medium text-foreground flex items-center gap-1 shadow">
              <Route className="w-3 h-3 text-primary" />
              {routeCode} · {visits.length} {t('mp.stops')}
            </div>
          </motion.div>

          <div className="px-5 py-4 space-y-4">
            {(loading || error || isEmpty) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-4 text-center"
              >
                {loading && (
                  <>
                    <p className="text-sm font-bold text-foreground">Tour wird geladen</p>
                    <p className="text-xs text-muted-foreground mt-1">Die heutige Route wird geladen.</p>
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
                    <p className="text-sm font-bold text-foreground">Keine Tour fuer heute</p>
                    <p className="text-xs text-muted-foreground mt-1">Sobald die Disposition eine Route zuweist, erscheint sie hier.</p>
                  </>
                )}
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-primary/5 rounded-xl px-4 py-3 border border-primary/10"
            >
              <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {t('mp.yourCities')}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {cities.join(' • ')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-2.5"
            >
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <Truck className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-extrabold text-foreground">{visits.length}</p>
                <p className="text-[10px] text-muted-foreground">{t('mp.visits')}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-extrabold text-foreground">{totalHours.toFixed(1)}h</p>
                <p className="text-[10px] text-muted-foreground">{t('mp.driveTime')}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <Droplets className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-extrabold text-foreground">{estimatedOilKg}</p>
                <p className="text-[10px] text-muted-foreground">{t('mp.oilExp')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-2.5"
            >
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <Package className="w-4 h-4 text-secondary mx-auto mb-1" />
                <p className="text-lg font-extrabold text-foreground">{expectedContainers}</p>
                <p className="text-[10px] text-muted-foreground">Container</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <Package className="w-4 h-4 text-secondary mx-auto mb-1" />
                <p className="text-lg font-extrabold text-foreground">{expectedProducts}</p>
                <p className="text-[10px] text-muted-foreground">Produkte</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <p className="text-xs font-semibold text-foreground mb-3">{t('mp.dayPlan')}</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{t('start')}</p>
                    <p className="text-[10px] text-muted-foreground">{startAddress}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">{plannedStartTime}</span>
                </div>

                {visits.slice(0, 3).map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {v.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{v.customerName}</p>
                      <p className="text-[10px] text-muted-foreground">{v.estimatedOilAmount} kg</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{v.scheduledTime}</span>
                  </div>
                ))}

                {visits.length > 3 && (
                  <div className="text-center">
                    <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      +{visits.length - 3} {t('mp.moreStops')}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-secondary/10 rounded-lg px-2 py-1.5 -mx-1">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{t('mp.break')}</p>
                    <p className="text-[10px] text-muted-foreground">{breakMinutes} {t('mp.minutes')}</p>
                  </div>
                  <span className="text-xs font-bold text-secondary-foreground">{breakTime}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{t('mp.end')}</p>
                    <p className="text-[10px] text-muted-foreground">{endAddress}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">{plannedEndTime}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center py-2"
            >
              <p className="text-sm text-muted-foreground">
                {t('mp.goodTrip')}
              </p>
            </motion.div>

            <Button
              onClick={onClose}
              className="w-full h-12 text-base font-bold bg-gradient-brand hover:opacity-90 rounded-xl"
            >
              {t('mp.letsGo')}
            </Button>

            <div className="h-2" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


export default MorningPopup;
