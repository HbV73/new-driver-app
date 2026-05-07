import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, Droplets, MapPin, Navigation, Phone, RefreshCw } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { useTodayRoute } from '@/hooks/useTodayRoute';
import type { DriverRouteVisit } from '@/lib/driverRoute';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const FALLBACK_LAT = 52.3759;
const FALLBACK_LNG = 9.732;

function matchesRouteParam(stop: DriverRouteVisit, routeParam?: string) {
  if (!routeParam) return false;
  return [
    stop.id,
    String(stop.stopOrder),
    String(stop.uiId),
    String(stop.uiVisit.id),
    stop.raw.external_ref,
  ].some((candidate) => candidate === routeParam);
}

const VisitNavigation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { routeData, stops, loading, error, refresh } = useTodayRoute();
  const selectedStop = stops.find((stop) => matchesRouteParam(stop, id));
  const visit = selectedStop?.uiVisit;
  const mapRef = useRef<HTMLDivElement>(null);
  const [eta] = useState('~8 Min');

  const destLat = selectedStop?.lat;
  const destLng = selectedStop?.lng;
  const hasDestinationCoords = typeof destLat === 'number' && typeof destLng === 'number';
  const startLat = routeData?.route.start_lat ?? FALLBACK_LAT;
  const startLng = routeData?.route.start_lng ?? FALLBACK_LNG;

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(
      hasDestinationCoords ? [(destLat + startLat) / 2, (destLng + startLng) / 2] : [startLat, startLng],
      hasDestinationCoords ? 14 : 13,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const driverIcon = L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;border-radius:50%;background:hsl(145,63%,32%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);">DRV</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    L.marker([startLat, startLng], { icon: driverIcon }).addTo(map);

    if (hasDestinationCoords) {
      const destIcon = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;border-radius:50%;background:hsl(0,84%,60%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);">PIN</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([destLat, destLng], { icon: destIcon }).addTo(map);

      L.polyline(
        [
          [startLat, startLng],
          [destLat, destLng],
        ],
        {
          color: 'hsl(145,63%,32%)',
          weight: 5,
          opacity: 0.8,
          smoothFactor: 1.5,
        },
      ).addTo(map);

      map.fitBounds(
        [
          [startLat, startLng],
          [destLat, destLng],
        ],
        { padding: [50, 50] },
      );
    }

    return () => {
      map.remove();
    };
  }, [destLat, destLng, hasDestinationCoords, startLat, startLng]);

  if (loading) {
    return (
      <AppLayout>
        <AppHeader title="Navigation" showBack />
        <div className="p-8 text-center">
          <p className="text-sm font-bold text-foreground">Besuch wird geladen</p>
          <p className="text-xs text-muted-foreground mt-1">Die heutige Route wird geladen.</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <AppHeader title="Navigation" showBack />
        <div className="p-8 text-center">
          <p className="text-sm font-bold text-destructive">Besuch konnte nicht geladen werden</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <button onClick={() => void refresh()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <RefreshCw className="w-3.5 h-3.5" />
            Erneut versuchen
          </button>
        </div>
      </AppLayout>
    );
  }

  if (!visit || !selectedStop) {
    return (
      <AppLayout>
        <AppHeader title="Nicht gefunden" showBack />
        <div className="p-8 text-center text-muted-foreground">Besuch nicht gefunden.</div>
      </AppLayout>
    );
  }

  const mapsDestination = hasDestinationCoords ? `${destLat},${destLng}` : visit.address;

  return (
    <AppLayout>
      <AppHeader title="Navigation" showBack />

      {/* Full map */}
      <div className="relative h-[45vh]">
        <div ref={mapRef} className="h-full w-full" />

        {!hasDestinationCoords && (
          <div className="absolute left-3 bottom-3 z-[1000] bg-card/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-border text-[11px] text-muted-foreground">
            Keine Koordinaten fuer diesen Besuch
          </div>
        )}

        {/* ETA overlay */}
        <div className="absolute top-3 left-3 z-[1000] bg-card/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg border border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{eta}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Ankunftszeit: {visit.scheduledTime}</p>
        </div>

        {/* Open in Maps */}
        <button
          onClick={() => window.open(`https://maps.google.com/?daddr=${encodeURIComponent(mapsDestination)}`, '_blank')}
          className="absolute top-3 right-3 z-[1000] bg-primary text-primary-foreground rounded-xl px-3 py-2.5 shadow-lg flex items-center gap-1.5 text-xs font-semibold"
        >
          <Navigation className="w-4 h-4" />
          Google Maps
        </button>
      </div>

      {/* Customer info card */}
      <div className="px-4 pt-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-bold text-foreground text-base">{visit.customerName}</h2>
              <p className="text-xs text-muted-foreground mt-1">{visit.contactPerson}</p>
            </div>
            <a
              href={`tel:${visit.phone}`}
              className="bg-primary/10 text-primary rounded-full p-2.5 flex-shrink-0"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{visit.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Droplets className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Erwartetes Oel: <strong className="text-foreground">{visit.estimatedOilAmount} kg</strong></span>
            </div>
          </div>

          {selectedStop.minOilCollected > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Mindestmenge: <strong className="text-foreground">{selectedStop.minOilCollected} kg</strong>
            </div>
          )}

          {visit.note && (
            <div className="mt-3 bg-warning/10 border border-warning/20 rounded-lg px-3 py-2 text-xs text-warning flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{visit.note}</span>
            </div>
          )}
        </motion.div>

        {/* Arrived button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={() => navigate(`/visit/${id}/collect`)}
            className="w-full h-14 text-base font-bold bg-gradient-brand hover:opacity-90 rounded-xl shadow-lg"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Ich bin angekommen
          </Button>
        </motion.div>

        <div className="h-4" />
      </div>
    </AppLayout>
  );
};

export default VisitNavigation;
