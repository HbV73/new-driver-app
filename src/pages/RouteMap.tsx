import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Clock,
  Coffee,
  Droplets,
  GripVertical,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  Play,
  RefreshCw,
  Timer,
  Warehouse,
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTodayRoute } from '@/hooks/useTodayRoute';
import type { DriverRouteVisit } from '@/lib/driverRoute';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BREAK_AFTER_VISIT = 3; // Pflichtpause after 3rd visit
const BREAK_DURATION_MIN = 60;
const FALLBACK_LAT = 52.3759;
const FALLBACK_LNG = 9.732;

function toDisplayTime(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 5);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function hasCoords(stop: DriverRouteVisit) {
  return typeof stop.lat === 'number' && typeof stop.lng === 'number';
}

const RouteMap = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { routeData, stops: routeStops, summary, loading, error, isEmpty, refresh } = useTodayRoute();
  const [activeStop] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const completed = summary?.completedStops ?? 0;
  const total = summary?.totalStops ?? 0;
  const breakReached = completed >= BREAK_AFTER_VISIT;
  const startLat = routeData?.route.start_lat ?? undefined;
  const startLng = routeData?.route.start_lng ?? undefined;
  const hasStartCoords = typeof startLat === 'number' && typeof startLng === 'number';
  const startAddress = routeData?.route.start_address ?? '-';
  const endAddress = routeData?.route.end_address ?? routeData?.route.start_address ?? '-';

  const routeBaseLocation = useMemo(
    () => ({
      lat: hasStartCoords ? startLat : FALLBACK_LAT,
      lng: hasStartCoords ? startLng : FALLBACK_LNG,
      label: routeData?.route.start_address ? 'Start' : t('route.warehouse'),
      address: startAddress,
    }),
    [hasStartCoords, routeData?.route.start_address, startAddress, startLat, startLng, t],
  );

  const stops = useMemo(
    () =>
      routeStops.map((stop) => ({
        id: stop.id,
        visit: stop.uiVisit,
        lat: stop.lat,
        lng: stop.lng,
        hasCoords: hasCoords(stop),
        eta: stop.scheduledTime ?? '-',
        distance:
          stop.raw.estimated_distance_km != null
            ? `${Number(stop.raw.estimated_distance_km).toLocaleString('de-DE')} km`
            : '-',
        arrivedAt: toDisplayTime(stop.arrivedAt),
        visitDuration:
          stop.raw.actual_duration_minutes != null ? `${stop.raw.actual_duration_minutes} Min` : undefined,
        departedAt: toDisplayTime(stop.departedAt ?? stop.completedAt),
      })),
    [routeStops],
  );

  const stopsWithCoords = useMemo(
    () => stops.filter((stop) => stop.hasCoords && typeof stop.lat === 'number' && typeof stop.lng === 'number'),
    [stops],
  );

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([routeBaseLocation.lat, routeBaseLocation.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const allCoords: L.LatLngExpression[] = [];

    const warehousePos: L.LatLngExpression = [routeBaseLocation.lat, routeBaseLocation.lng];
    allCoords.push(warehousePos);

    const warehouseIcon = L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;border-radius:10px;background:hsl(145,63%,32%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.35);">WH</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker(warehousePos, { icon: warehouseIcon })
      .addTo(map)
      .bindPopup(`<b>${routeBaseLocation.label}</b><br/>${routeBaseLocation.address}<br/><em>Startpunkt</em>`);

    stopsWithCoords.forEach((stop) => {
      const pos: L.LatLngExpression = [stop.lat!, stop.lng!];
      allCoords.push(pos);

      const isCompleted = stop.visit.status === 'completed';
      const isActive = stop.visit.status === 'in_progress';
      const bg = isCompleted ? 'hsl(145,63%,32%)' : isActive ? 'hsl(45,93%,47%)' : 'hsl(210,10%,60%)';
      const size = isActive ? 38 : 32;
      const pulse = isActive ? 'animation:pulse 2s infinite;' : '';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;">
            ${isActive ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:hsl(45,93%,47%,0.25);${pulse}"></div>` : ''}
            <div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${isActive ? 16 : 14}px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative;z-index:2;">
              ${stop.visit.order}
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      L.marker(pos, { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:160px;">
            <b style="font-size:13px;">${stop.visit.order}. ${stop.visit.customerName}</b><br/>
            <span style="color:#666;font-size:11px;">${stop.visit.address}</span><br/>
            <span style="color:#2d6a4f;font-weight:600;">~${stop.visit.estimatedOilAmount} kg Oel</span>
            ${stop.visit.scheduledTime ? `<br/><span style="color:#888;font-size:11px;">${stop.visit.scheduledTime}</span>` : ''}
          </div>
        `);
    });

    const completedCoords: L.LatLngExpression[] = [warehousePos];
    const pendingCoords: L.LatLngExpression[] = [];
    let transitionDone = false;

    stopsWithCoords.forEach((stop) => {
      const pos: L.LatLngExpression = [stop.lat!, stop.lng!];
      if (stop.visit.status === 'completed') {
        completedCoords.push(pos);
      } else {
        if (!transitionDone) {
          pendingCoords.push(completedCoords[completedCoords.length - 1]);
          transitionDone = true;
        }
        pendingCoords.push(pos);
      }
    });

    if (completedCoords.length > 1) {
      L.polyline(completedCoords, { color: 'hsl(145,63%,32%)', weight: 5, opacity: 0.9 }).addTo(map);
    }
    if (pendingCoords.length > 1) {
      L.polyline(pendingCoords, { color: 'hsl(145,63%,32%)', weight: 4, opacity: 0.4, dashArray: '10 8' }).addTo(map);
    }
    if (stopsWithCoords.length > 0) {
      const lastStop = stopsWithCoords[stopsWithCoords.length - 1];
      L.polyline([[lastStop.lat!, lastStop.lng!], warehousePos], {
        color: 'hsl(145,63%,32%)',
        weight: 2,
        opacity: 0.2,
        dashArray: '4 8',
      }).addTo(map);
    }

    const bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds, { padding: [40, 40] });

    const style = document.createElement('style');
    style.textContent = `@keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.4); opacity: 0; } }`;
    document.head.appendChild(style);

    return () => {
      map.remove();
      style.remove();
    };
  }, [stopsWithCoords, routeBaseLocation]);

  const renderRouteItems = () => {
    const items: JSX.Element[] = [];

    stops.forEach((stop, i) => {
      const isCompleted = stop.visit.status === 'completed';
      const isActive = stop.visit.status === 'in_progress' || activeStop === stop.id;
      const timeData = {
        arrivedAt: stop.arrivedAt,
        visitDuration: stop.visitDuration,
        departedAt: stop.departedAt,
      };

      items.push(
        <motion.div
          key={stop.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          onClick={() => navigate(`/visit/${stop.visit.id}`)}
          className={`relative flex items-start gap-3 py-3 px-1 cursor-pointer rounded-xl transition-colors ${isActive ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
        >
          <div className="relative z-10 flex-shrink-0 mt-0.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
              isCompleted
                ? 'bg-primary text-primary-foreground border-primary'
                : isActive
                  ? 'bg-primary/10 text-primary border-primary animate-pulse'
                  : 'bg-card text-muted-foreground border-border'
            }`}>
              {stop.visit.order}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {stop.visit.customerName}
            </p>

            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {stop.eta}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {stop.hasCoords ? stop.distance : 'Keine Koordinaten'}
              </span>
              <span className="text-[11px] text-primary flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {stop.visit.estimatedOilAmount} kg
              </span>
            </div>

            {(timeData.arrivedAt || timeData.visitDuration || timeData.departedAt || isActive) && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {timeData.arrivedAt && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/8 text-primary px-1.5 py-0.5 rounded-md">
                    <LogIn className="w-2.5 h-2.5" />
                    {timeData.arrivedAt}
                  </span>
                )}
                {timeData.visitDuration && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-md">
                    <Timer className="w-2.5 h-2.5" />
                    {timeData.visitDuration}
                  </span>
                )}
                {timeData.departedAt && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                    <LogOut className="w-2.5 h-2.5" />
                    {timeData.departedAt}
                  </span>
                )}
                {isActive && !timeData.departedAt && timeData.arrivedAt && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md animate-pulse">
                    <Play className="w-2.5 h-2.5" />
                    {t('route.onSite')}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 mt-1">
            <GripVertical className="w-4 h-4 text-muted-foreground/40" />
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </div>
        </motion.div>,
      );

      if (stop.visit.order === BREAK_AFTER_VISIT) {
        items.push(
          <motion.div
            key="pflichtpause"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (i + 1) * 0.08 }}
            className="relative py-2 px-1"
          >
            <div
              onClick={() => navigate('/break')}
              className={`rounded-2xl border-2 border-dashed p-3.5 transition-all cursor-pointer active:scale-[0.98] ${
                breakReached
                  ? 'border-amber-400/60 bg-amber-50/30 hover:bg-amber-50/50'
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 shrink-0 ${
                  breakReached ? 'bg-amber-100 border-amber-400' : 'bg-muted border-border'
                }`}>
                  <Coffee className={`w-5 h-5 ${breakReached ? 'text-amber-600' : 'text-muted-foreground'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${breakReached ? 'text-amber-700' : 'text-foreground'}`}>
                    {t('route.mandatoryBreak')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('route.legalRest').replace('{min}', String(BREAK_DURATION_MIN))}
                  </p>
                </div>

                {breakReached && (
                  <span className="shrink-0 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-sm">
                    {t('route.startBreak')}
                  </span>
                )}
                {!breakReached && (
                  <span className="text-[10px] text-muted-foreground">{BREAK_DURATION_MIN} Min</span>
                )}
              </div>
            </div>
          </motion.div>,
        );
      }
    });

    return items;
  };

  return (
    <AppLayout>
      <AppHeader title="Route" showBack />

      <div className="relative h-64 overflow-hidden">
        <div ref={mapRef} className="h-full w-full" />
        {routeStops.length > 0 && stopsWithCoords.length === 0 && (
          <div className="absolute left-3 bottom-4 z-[1000] rounded-lg border border-border bg-card/90 px-3 py-2 text-[11px] font-medium text-muted-foreground shadow-sm">
            Keine Koordinaten fuer diese Route
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted z-[1000]">
          <motion.div
            className="h-full bg-gradient-brand"
            initial={{ width: 0 }}
            animate={{ width: `${total === 0 ? 0 : (completed / total) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="absolute top-3 right-3 z-[1000] bg-card/90 backdrop-blur-sm rounded-lg px-2.5 py-2 shadow-sm border border-border/50">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
            <div className="w-3 h-0.5 bg-primary rounded-full" />
            <span>{t('tour.done')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
            <div className="w-3 h-0.5 bg-primary/40 rounded-full border-dashed" style={{ borderTop: '1.5px dashed hsl(145,63%,32%)' }} />
            <span>{t('open')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Warehouse className="w-3 h-3" />
            <span>{t('route.warehouse')}</span>
          </div>
        </div>
      </div>

      {(loading || error || isEmpty) && (
        <div className="px-4 pt-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            {loading && (
              <>
                <p className="text-sm font-bold text-foreground">Route wird geladen</p>
                <p className="text-xs text-muted-foreground mt-1">Die heutige Route wird aus Supabase geladen.</p>
              </>
            )}
            {error && (
              <>
                <p className="text-sm font-bold text-destructive">Route konnte nicht geladen werden</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <button onClick={() => void refresh()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Erneut versuchen
                </button>
              </>
            )}
            {isEmpty && (
              <>
                <p className="text-sm font-bold text-foreground">Keine Route fuer heute</p>
                <p className="text-xs text-muted-foreground mt-1">Sobald die Disposition eine Route zuweist, erscheint sie hier.</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{t('route.order')}</h2>
          <span className="text-xs text-muted-foreground">{completed}/{total} {t('route.completed')}</span>
        </div>

        <div className="relative">
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative flex items-center gap-3 py-3 px-1 rounded-xl"
          >
            <div className="relative z-10 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-lg border-2 border-primary/30">
                <Warehouse className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary">{routeBaseLocation.label}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {routeBaseLocation.address}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Start</span>
          </motion.div>

          <div className="space-y-0">
            {renderRouteItems()}
          </div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: stops.length * 0.08 }}
            className="relative flex items-center gap-3 py-3 px-1 rounded-xl opacity-50"
          >
            <div className="relative z-10 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg border-2 border-border">
                <Warehouse className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{t('route.returnToWarehouse')}</p>
              <p className="text-[11px] text-muted-foreground/70">{endAddress}</p>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Ende</span>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RouteMap;
