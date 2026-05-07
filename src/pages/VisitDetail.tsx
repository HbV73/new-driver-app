import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Droplets, ChevronRight, Timer, Crown, Award, Medal, AlertTriangle, UserX, Landmark, Package, Info, Printer, CheckCircle2, RefreshCw } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import ContainerScanner, { ScannedContainer, OtherContainer } from '@/components/ContainerScanner';
import ProductRow from '@/components/ProductRow';
import VisitSummary from '@/components/VisitSummary';
import FailedVisitDialog from '@/components/FailedVisitDialog';
import DamageReportDialog from '@/components/DamageReportDialog';
import DeliverySignatureDialog from '@/components/DeliverySignatureDialog';
import OtherContainersPicker from '@/components/OtherContainersPicker';
import FillPredictionCard from '@/components/FillPredictionCard';
import BinUpsellCard from '@/components/BinUpsellCard';
import QualityScoreBadge from '@/components/QualityScoreBadge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { submitProofOfCollection } from '@/lib/proofOfCollection';
import { useTodayRoute } from '@/hooks/useTodayRoute';
import type { DriverRouteVisit } from '@/lib/driverRoute';
import type { Container, Product } from '@/types';
import { getDriverApi } from '@/services/driverApi';
import { toast } from 'sonner';

const customerTiers: Record<number, { tier: 'platinum' | 'gold' | 'silver' | 'dormant'; label: string }> = {
  976: { tier: 'platinum', label: 'Platinum' },
  452: { tier: 'gold', label: 'Gold' },
  378: { tier: 'silver', label: 'Silver' },
  214: { tier: 'dormant', label: 'Dormant' },
  589: { tier: 'gold', label: 'Gold' },
  741: { tier: 'silver', label: 'Silver' },
};

const tierStyles = {
  platinum: { icon: Crown, bg: 'bg-gradient-to-r from-purple-500 to-violet-600', text: 'text-white', badge: 'bg-purple-100 text-purple-700' },
  gold: { icon: Award, bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', text: 'text-white', badge: 'bg-amber-100 text-amber-700' },
  silver: { icon: Medal, bg: 'bg-gradient-to-r from-slate-400 to-slate-500', text: 'text-white', badge: 'bg-slate-100 text-slate-600' },
  dormant: { icon: AlertTriangle, bg: 'bg-gradient-to-r from-red-400 to-rose-500', text: 'text-white', badge: 'bg-red-50 text-red-600' },
};

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function textFrom(record: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function numberFrom(record: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];
    const next = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    if (Number.isFinite(next)) return next;
  }
  return fallback;
}

function productsFromStop(stop?: DriverRouteVisit): Product[] {
  return (stop?.productsExpected ?? [])
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) return null;
      const name = textFrom(record, ['name', 'product_name', 'label', 'title']);
      if (!name) return null;

      return {
        id: numberFrom(record, ['id', 'product_id', 'sku'], index + 1),
        name,
        price: numberFrom(record, ['price', 'unit_price', 'gross_price', 'net_price']),
        oldPrice: numberFrom(record, ['old_price', 'oldPrice'], 0) || undefined,
        unit: textFrom(record, ['unit', 'uom'], 'Stueck'),
      };
    })
    .filter((product): product is Product => Boolean(product));
}

function containerInventoryFromStop(stop?: DriverRouteVisit) {
  return (stop?.containersExpected ?? [])
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const containerId = textFrom(record, ['containerId', 'container_id', 'id', 'barcode', 'code', 'serial']);
      if (!containerId) return null;
      return {
        containerId,
        type: textFrom(record, ['type', 'container_type', 'label', 'size'], 'Container'),
      };
    })
    .filter((container): container is { containerId: string; type: string } => Boolean(container));
}

function containerSummaryFromStop(stop?: DriverRouteVisit): Container[] {
  const counts = new Map<string, number>();
  containerInventoryFromStop(stop).forEach((container) => {
    counts.set(container.type, (counts.get(container.type) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([label, count]) => ({
    type: label.toLowerCase().includes('barrel') || label.toLowerCase().includes('fass') ? 'barrel_60' : 'bin',
    label,
    count,
  }));
}

const VisitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { stops, loading, error, refresh } = useTodayRoute();
  const selectedStop = stops.find((stop) => matchesRouteParam(stop, id));
  const visit = selectedStop?.uiVisit;
  const routeProducts = productsFromStop(selectedStop);
  const customerInventory = containerInventoryFromStop(selectedStop);
  const containerSummary = containerSummaryFromStop(selectedStop);
  const [showOil, setShowOil] = useState(true);
  const [showProducts, setShowProducts] = useState(true);
  const [showCompanyContainers, setShowCompanyContainers] = useState(true);
  const [showOtherContainers, setShowOtherContainers] = useState(false);
  const [oilCollected, setOilCollected] = useState('');
  const [oilInvoiced, setOilInvoiced] = useState('');
  const [scannedContainers, setScannedContainers] = useState<ScannedContainer[]>([]);
  const [otherContainers, setOtherContainers] = useState<OtherContainer[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showFailedDialog, setShowFailedDialog] = useState(false);
  const [showDamageDialog, setShowDamageDialog] = useState(false);
  const [productQtys, setProductQtys] = useState<Record<number, number>>({});
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <AppHeader title={t('visit.notFound')} showBack />
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
        <AppHeader title={t('visit.notFound')} showBack />
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
        <AppHeader title={t('visit.notFound')} showBack />
        <div className="p-8 text-center text-muted-foreground">{t('visit.notFoundMsg')}</div>
      </AppLayout>
    );
  }

  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;
  const timerColor = elapsed > 600 ? 'text-destructive' : elapsed > 300 ? 'text-warning' : 'text-white/90';
  const localSyncLabel = selectedStop.localSyncStatus === 'failed'
    ? (lang === 'de' ? 'Synchronisierung fehlgeschlagen' : 'Sync failed')
    : selectedStop.localSyncStatus
      ? (lang === 'de' ? 'Offline gespeichert - Synchronisierung ausstehend' : 'Saved offline - sync pending')
      : null;

  const routeTier = selectedStop.customerTier?.toLowerCase();
  const tier =
    routeTier && routeTier in tierStyles
      ? { tier: routeTier as keyof typeof tierStyles, label: selectedStop.customerTier ?? 'Silver' }
      : customerTiers[visit.id] || { tier: 'silver' as const, label: 'Silver' };
  const ts = tierStyles[tier.tier];
  const TierIcon = ts.icon;

  return (
    <AppLayout>
      {/* Compact hero header with timer + tier */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-brand relative overflow-hidden"
      >
        <div className="px-4 pt-3 pb-4">
          {/* Top row: back + timer */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white p-1 -ml-1">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1.5 text-white/55 cursor-not-allowed"
                aria-label="Print customer info unavailable"
                title={lang === 'de' ? 'Kundendruck noch nicht mit echten Daten verbunden' : 'Customer printout is not connected to real data yet'}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">{lang === 'de' ? 'Druck bald' : 'Print soon'}</span>
              </button>
              <motion.div
                className={`flex items-center gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 ${timerColor}`}
                animate={elapsed > 600 ? { scale: [1, 1.03, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Timer className="w-3.5 h-3.5" />
                <span className="text-sm font-mono font-bold tabular-nums">
                  {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Customer name + tier badge */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{visit.customerName}</h1>
              <p className="text-white/70 text-xs mt-0.5">{visit.contactPerson}</p>
            </div>
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${ts.badge} text-[10px] font-bold uppercase tracking-wide`}>
              <TierIcon className="w-3 h-3" />
              {tier.label}
            </div>
          </div>

          {/* Quick info pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            <a href={`tel:${visit.phone}`} className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] text-white/90">
              <Phone className="w-3 h-3" /> {visit.phone}
            </a>
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] text-white/90">
              <Droplets className="w-3 h-3" /> {visit.contractPrice},00 €
            </div>
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] text-white/90">
              <MapPin className="w-3 h-3" /> {visit.address.split(',')[0]}
            </div>
          </div>
        </div>

        {tier.tier === 'dormant' && (
          <div className="bg-destructive/20 backdrop-blur-sm px-4 py-1.5 text-[10px] text-white font-medium text-center">
            ⚠️ {t('visit.dormantWarning')}
          </div>
        )}
      </motion.div>

      {/* Note */}
      {visit.note && (
        <div className="mx-4 -mt-2 relative z-10">
          <div className="bg-warning/10 border border-warning/20 rounded-xl px-3 py-2 text-xs text-warning">
            📝 {visit.note}
          </div>
        </div>
      )}

      {localSyncLabel && (
        <div className="mx-4 mt-2 relative z-10">
          <div className={`rounded-xl px-3 py-2 text-xs border ${
            selectedStop.localSyncStatus === 'failed'
              ? 'bg-destructive/10 border-destructive/20 text-destructive'
              : 'bg-primary/10 border-primary/20 text-primary'
          }`}>
            {localSyncLabel}
            {selectedStop.localSyncError && (
              <span className="block text-[10px] mt-0.5 opacity-80">{selectedStop.localSyncError}</span>
            )}
          </div>
        </div>
      )}

      {/* Bank update request banner */}
      {visit.bankUpdateRequired && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-2 relative z-10"
        >
          <button
            disabled
            className="w-full flex items-center gap-3 p-3 bg-warning/10 border border-warning/25 rounded-xl opacity-80 cursor-not-allowed"
          >
            <div className="w-9 h-9 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
              <Landmark className="w-4.5 h-4.5 text-warning" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[12px] font-bold text-foreground">{t('visit.bankUpdate')}</p>
              <p className="text-[10px] text-muted-foreground">
                {lang === 'de' ? 'Bankdaten-Update ist noch nicht mit dem Backend verbunden.' : 'Bank update is not connected to the backend yet.'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-warning/60" />
          </button>
        </motion.div>
      )}

      {/* AI Fill Prediction + Quality Score badge */}
      <div className="mx-4 mt-2 relative z-10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {lang === 'de' ? 'Kunden-Insights' : 'Customer insights'}
          </span>
          <QualityScoreBadge customerRef={String(visit.id)} />
        </div>
        <FillPredictionCard customerRef={String(visit.id)} customerName={visit.customerName} />
      </div>


      {(() => {
        const inventory = customerInventory;
        const pickedUpIds = scannedContainers.filter(c => c.direction === 'pickup').map(c => c.id);
        const remaining = inventory.filter(c => !pickedUpIds.includes(c.containerId));
        const pickedCount = pickedUpIds.length;

        if (inventory.length === 0) return null;

        return (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-2 relative z-10"
          >
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground">{t('visit.containersAtCustomer')}</h4>
                <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {remaining.length} / {inventory.length}
                </span>
              </div>
              <div className="space-y-1">
                {inventory.map(c => {
                  const isPickedUp = pickedUpIds.includes(c.containerId);
                  return (
                    <div key={c.containerId} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${isPickedUp ? 'bg-primary/5 line-through opacity-50' : 'bg-muted/50'}`}>
                      <span className="font-mono text-muted-foreground">{c.containerId}</span>
                      <span className="text-muted-foreground">{c.type}</span>
                      {isPickedUp && <span className="text-[10px] text-primary font-semibold">✓ {t('visit.pickedUp')}</span>}
                    </div>
                  );
                })}
              </div>
              {pickedCount > 0 && remaining.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 flex items-start gap-2 bg-accent/50 border border-accent rounded-lg px-2.5 py-2"
                >
                  <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-foreground/80">
                    <strong className="text-foreground">{remaining.length}</strong> {t('visit.containersRemain')}
                    {remaining.length === 1 && ` ${t('visit.pickupNextVisit')}`}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })()}

      <div className="px-4 pt-4 space-y-4 pb-6">
        {/* 1. Oil — two inputs side by side */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">1</div>
              <h3 className="text-sm font-semibold text-foreground">{t('visit.usedOil')}</h3>
            </div>
            <Switch checked={showOil} onCheckedChange={setShowOil} />
          </div>
          <AnimatePresence>
            {showOil && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block font-medium">{t('visit.collected')}</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={oilCollected}
                        onChange={(e) => setOilCollected(e.target.value)}
                        className="text-center text-base font-bold h-11"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block font-medium">{t('visit.invoiced')}</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={oilInvoiced}
                        onChange={(e) => setOilInvoiced(e.target.value)}
                        className="text-center text-base font-bold h-11"
                      />
                    </div>
                  </div>
                  {(Number(oilCollected) > 0 || Number(oilInvoiced) > 0) && (
                    <div className="flex gap-3 mt-2.5 pt-2.5 border-t border-border">
                      {Number(oilCollected) > 0 && (
                        <span className="text-[11px] font-medium text-primary">✓ {oilCollected} {t('visit.kgCollected')}</span>
                      )}
                      {Number(oilInvoiced) > 0 && (
                        <span className="text-[11px] font-medium text-muted-foreground">📄 {oilInvoiced} {t('visit.kgInvoiced')}</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 2. Products */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">2</div>
              <h3 className="text-sm font-semibold text-foreground">{t('visit.products')}</h3>
            </div>
            <Switch checked={showProducts} onCheckedChange={setShowProducts} />
          </div>
          <AnimatePresence>
            {showProducts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {routeProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onQtyChange={(qty) => setProductQtys(prev => ({ ...prev, [product.id]: qty }))}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 3. Company Containers (QR Scan) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">3</div>
              <h3 className="text-sm font-semibold text-foreground">{t('visit.companyContainers')}</h3>
            </div>
            <Switch checked={showCompanyContainers} onCheckedChange={setShowCompanyContainers} />
          </div>
          <AnimatePresence>
            {showCompanyContainers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-2xl border border-border p-4">
                  <ContainerScanner
                    scannedContainers={scannedContainers}
                    onScan={(c) => setScannedContainers(prev => [...prev, c])}
                    onRemove={(cid) => setScannedContainers(prev => prev.filter(c => c.id !== cid))}
                    otherContainers={[]}
                    onOtherContainersChange={() => {}}
                    hideOtherContainers
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 4. Other Containers */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">4</div>
              <h3 className="text-sm font-semibold text-foreground">{t('visit.otherContainers')}</h3>
            </div>
            <Switch checked={showOtherContainers} onCheckedChange={setShowOtherContainers} />
          </div>
          <AnimatePresence>
            {showOtherContainers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-2xl border border-border p-4">
                  <OtherContainersPicker
                    otherContainers={otherContainers}
                    onOtherContainersChange={setOtherContainers}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bin upsell card (driver suggestion) */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <BinUpsellCard
            customerRef={String(visit.id)}
            customerName={visit.customerName}
            suggestedReason={
              Number(oilCollected) > 0 && Number(oilCollected) >= visit.estimatedOilAmount * 0.9
                ? (lang === 'de'
                    ? 'Behälter war fast voll – ein zusätzlicher Behälter könnte sinnvoll sein.'
                    : 'Bin was nearly full — an extra bin could help.')
                : undefined
            }
            estimatedExtraKgMonth={Number(oilCollected) > 0 ? Math.round(Number(oilCollected) * 1.5) : undefined}
          />
        </motion.div>

        {/* Buttons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-2">
          <Button
            onClick={() => setShowSummary(true)}
            className="w-full h-12 text-base font-semibold bg-gradient-brand hover:opacity-90 rounded-2xl shadow-lg"
          >
            {t('visit.summary')}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFailedDialog(true)}
            className="w-full h-11 text-sm font-medium rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            <UserX className="w-4 h-4 mr-1.5" />
            {t('visit.customerNotMet')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDamageDialog(true)}
            className="w-full h-11 text-sm font-medium rounded-2xl border-amber-500/40 text-amber-700 hover:bg-amber-500/5"
          >
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            {lang === 'de' ? 'Schaden / Verlust melden' : 'Report damage / loss'}
          </Button>
          <DeliverySignatureDialog
            visitRef={String(visit.id)}
            customerName={visit.customerName}
            defaultPurpose="fresh_food_delivery"
            trigger={
              <Button
                variant="outline"
                className="w-full h-11 text-sm font-medium rounded-2xl border-primary/40 text-primary hover:bg-primary/5"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {t('sig.signFreshFood')}
              </Button>
            }
          />
        </motion.div>

        <div className="h-2" />
      </div>


      <VisitSummary
        open={showSummary}
        onClose={() => setShowSummary(false)}
        onComplete={async () => {
          if (user) {
            const completedAt = new Date().toISOString();
            const containersPicked = scannedContainers
              .filter(c => c.direction === 'pickup')
              .map(c => ({ id: c.id, at: c.scannedAt }));
            const containersDropped = scannedContainers
              .filter(c => c.direction === 'dropoff')
              .map(c => ({ id: c.id, at: c.scannedAt }));
            const productsDelivered = routeProducts
              .map(p => ({
                id: p.id,
                name: p.name,
                qty: productQtys[p.id] || 0,
                price: p.price,
              }))
              .filter(p => p.qty > 0);
            const res = await submitProofOfCollection({
              userId: user.id,
              visitRef: String(visit.id),
              customerName: visit.customerName,
              netWeightKg: Number(oilCollected) || 0,
              containersPicked,
              containersDropped,
            });
            let stopQueued = false;
            if (res.ok) {
              try {
                const stopResult = await getDriverApi().updateStopStatus(
                  { driverUserId: user.id },
                  {
                    stopId: selectedStop.id,
                    routeId: selectedStop.routeId,
                    status: 'completed',
                    completedAt,
                    collectedOilKg: Number(oilCollected) || 0,
                    proofOfCollectionId: res.proofOfCollectionId,
                    containersPicked,
                    containersDropped,
                    productsDelivered,
                  },
                );
                stopQueued = Boolean(stopResult.queued);
              } catch (err) {
                toast.error(
                  lang === 'de'
                    ? 'Nachweis gespeichert, aber der Tourstopp konnte nicht abgeschlossen werden.'
                    : 'Proof saved, but the route stop could not be marked completed.',
                );
                console.error('Failed to update route stop after proof submission', err);
              }
            }
            toast.success(res.queued || stopQueued
              ? (lang === 'de' ? 'Offline gespeichert - wird spaeter synchronisiert' : 'Saved offline - will sync later')
              : (lang === 'de' ? 'Besuch abgeschlossen' : 'Visit completed'));
          }
          navigate('/');
        }}
        visit={visit}
        netWeight={Number(oilCollected) || 0}
        products={routeProducts.map(p => ({
          name: p.name,
          qty: productQtys[p.id] || 0,
          price: p.price,
        }))}
        scannedContainers={scannedContainers}
        otherContainers={otherContainers}
        containers={containerSummary}
      />

      <FailedVisitDialog
        open={showFailedDialog}
        onClose={() => setShowFailedDialog(false)}
        onComplete={async (reason, note) => {
          if (!user) {
            toast.error('Auth error');
            return;
          }

          try {
            const result = await getDriverApi().updateStopStatus(
              { driverUserId: user.id },
              {
                stopId: selectedStop.id,
                routeId: selectedStop.routeId,
                status: 'skipped',
                skippedAt: new Date().toISOString(),
                skipReason: reason,
                driverNotes: note.trim() || null,
              },
            );
            toast.success(result.queued
              ? (lang === 'de' ? 'Fehlbesuch offline gespeichert - wird synchronisiert' : 'Failed visit saved offline - will sync')
              : (lang === 'de' ? 'Fehlbesuch gespeichert' : 'Failed visit saved'));
            setShowFailedDialog(false);
            navigate('/');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed visit could not be saved');
          }
        }}
        visit={visit}
      />

      <DamageReportDialog
        open={showDamageDialog}
        onClose={() => setShowDamageDialog(false)}
        visitRef={String(visit.id)}
        customerName={visit.customerName}
      />
    </AppLayout>
  );
};

export default VisitDetail;
