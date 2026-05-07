import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Package, QrCode, MapPin, ChevronRight, Check, ArrowRight, RefreshCw } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTodayRoute } from '@/hooks/useTodayRoute';
import type { DriverRouteVisit } from '@/lib/driverRoute';

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

function numberFrom(record: Record<string, unknown>, keys: string[], fallback = 1) {
  for (const key of keys) {
    const value = record[key];
    const next = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    if (Number.isFinite(next) && next > 0) return next;
  }
  return fallback;
}

function productItemsFromStops(stops: DriverRouteVisit[]) {
  return stops
    .flatMap((stop) => stop.productsExpected)
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) return null;
      const name = textFrom(record, ['name', 'product_name', 'label', 'title']);
      if (!name) return null;
      return {
        id: textFrom(record, ['id', 'product_id', 'sku'], String(index + 1)),
        name,
        quantity: numberFrom(record, ['qty', 'quantity', 'count', 'amount']),
      };
    })
    .filter((item): item is { id: string; name: string; quantity: number } => Boolean(item));
}

function containerItemsFromStops(stops: DriverRouteVisit[], fallbackLabel: string) {
  const counts = new Map<string, number>();

  stops.flatMap((stop) => stop.containersExpected).forEach((item) => {
    const record = asRecord(item);
    const name = record ? textFrom(record, ['type', 'container_type', 'label', 'size'], fallbackLabel) : fallbackLabel;
    counts.set(name, (counts.get(name) ?? 0) + numberFrom(record ?? {}, ['qty', 'quantity', 'count', 'amount']));
  });

  return Array.from(counts.entries()).map(([name, quantity]) => ({
    name,
    quantity,
    emoji: '-',
  }));
}

const MorningFlow = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { routeData, stops, summary, dailySummary, loading, error, isEmpty, refresh } = useTodayRoute();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [discharged, setDischarged] = useState(false);
  const [loadedItems, setLoadedItems] = useState<Record<string, boolean>>({});
  const [scannedCount, setScannedCount] = useState(0);

  const steps = [
    { id: 1, title: t('morning.discharge'), icon: Trash2, color: 'text-destructive' },
    { id: 2, title: t('morning.loadVehicle'), icon: Package, color: 'text-primary' },
    { id: 3, title: t('morning.scanContainers'), icon: QrCode, color: 'text-secondary' },
    { id: 4, title: t('route.title'), icon: MapPin, color: 'text-primary' },
  ];

  const visits = stops.map((stop) => stop.uiVisit);
  const routeLoadingItems = containerItemsFromStops(stops, t('morning.containers'));
  const routeProducts = productItemsFromStops(stops);
  const expectedContainerCount = summary?.expectedContainers ?? dailySummary?.totalContainers ?? 0;
  const estimatedOilKg = summary?.estimatedOilKg ?? dailySummary?.estimatedOilKg ?? 0;
  const plannedStartTime = dailySummary?.startTime ?? summary?.startTime ?? '--';
  const plannedEndTime = dailySummary?.estimatedEndTime ?? summary?.estimatedEndTime ?? '--';
  const routeCode = routeData?.route.route_code ?? '--';
  const startAddress = routeData?.route.start_address ?? '--';
  const endAddress = routeData?.route.end_address ?? routeData?.route.start_address ?? '--';

  const completeStep = (step: number) => {
    setCompletedSteps(prev => [...prev, step]);
    if (step < 4) {
      setCurrentStep(step + 1);
    } else {
      navigate('/');
    }
  };

  return (
    <AppLayout>
      <AppHeader title={t('morning.title')} showBack />

      <div className="px-4 pt-4 pb-4">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                completedSteps.includes(step.id)
                  ? 'bg-primary border-primary text-primary-foreground'
                  : currentStep === step.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted border-border text-muted-foreground'
              }`}>
                {completedSteps.includes(step.id) ? <Check className="w-4 h-4" /> : step.id}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${
                  completedSteps.includes(step.id) ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {(loading || error || isEmpty) && (
          <div className="bg-card rounded-xl border border-border p-4 text-center">
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
          </div>
        )}

        {!loading && !error && !isEmpty && (
        <AnimatePresence mode="wait">
          {/* Step 1: Discharge */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{t('morning.discharge')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('morning.dischargeSub')}
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('morning.fullBins')}</span>
                  <span className="text-sm font-bold text-foreground">4 {t('morning.pieces')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('morning.fullBarrels60')}</span>
                  <span className="text-sm font-bold text-foreground">1 {t('morning.pieces')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('morning.fullBarrels30')}</span>
                  <span className="text-sm font-bold text-foreground">2 {t('morning.pieces')}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">{t('morning.estimated')}</span>
                  <span className="text-sm font-bold text-primary">~{estimatedOilKg} kg {t('morning.usedOil')}</span>
                </div>
              </div>

              <Button
                onClick={() => { setDischarged(true); completeStep(1); }}
                className="w-full h-12 bg-gradient-brand hover:opacity-90"
              >
                {t('morning.dischargeDone')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Load */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{t('morning.loadVehicle')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('morning.loadSub')}
                </p>
              </div>

              {/* Containers to load */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">{t('morning.containers')}</h4>
                {routeLoadingItems.map(item => (
                  <button
                    key={item.name}
                    onClick={() => setLoadedItems(prev => ({ ...prev, [item.name]: !prev[item.name] }))}
                    className={`w-full flex items-center gap-3 bg-card rounded-xl border p-3 transition-all ${
                      loadedItems[item.name]
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-sm font-medium text-foreground flex-1 text-left">{item.name}</span>
                    <span className="text-sm font-bold text-foreground">{item.quantity}x</span>
                    {loadedItems[item.name] && <Check className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>

              {/* Products to load */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">{t('morning.goods')}</h4>
                {routeProducts.slice(0, 3).map(product => (
                  <button
                    key={product.id}
                    onClick={() => setLoadedItems(prev => ({ ...prev, [product.name]: !prev[product.name] }))}
                    className={`w-full flex items-center gap-3 bg-card rounded-xl border p-3 transition-all ${
                      loadedItems[product.name]
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground flex-1 text-left truncate">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.quantity}x</span>
                    {loadedItems[product.name] && <Check className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => completeStep(2)}
                className="w-full h-12 bg-gradient-brand hover:opacity-90"
              >
                {t('morning.allLoaded')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 3: Scan */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-8 h-8 text-secondary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{t('morning.scanContainers')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {scannedCount}/{expectedContainerCount} {t('morning.scanned')}
                </p>
              </div>

              <div className="bg-muted rounded-2xl aspect-square max-w-[280px] mx-auto flex items-center justify-center border-2 border-dashed border-primary/30">
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-primary/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('morning.scanQr')}</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setScannedCount(expectedContainerCount);
                  completeStep(3);
                }}
                variant="outline"
                className="w-full h-12"
              >
                {t('morning.markAllScanned')}
              </Button>

              <Button
                onClick={() => completeStep(3)}
                className="w-full h-12 bg-gradient-brand hover:opacity-90"
                disabled={expectedContainerCount > 0 && scannedCount < expectedContainerCount}
              >
                {t('morning.toRoute')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 4: Route overview */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{t('morning.yourRoute')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {visits.length} {t('morning.stopsOil').replace('{oil}', String(estimatedOilKg))}
                </p>
              </div>

              {/* Mini route map placeholder */}
              <div className="bg-muted rounded-xl h-40 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{routeCode}</p>
                  <p className="text-xs text-muted-foreground">{plannedStartTime} - {plannedEndTime}</p>
                  <p className="text-xs text-muted-foreground">{`${startAddress} -> ${endAddress}`}</p>
                </div>
              </div>

              {/* First 3 stops preview */}
              <div className="space-y-2">
                {visits.slice(0, 3).map(visit => (
                  <div key={visit.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {visit.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{visit.customerName}</p>
                      <p className="text-xs text-muted-foreground">{visit.scheduledTime} - {visit.estimatedOilAmount} kg</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                ))}
                <p className="text-xs text-center text-muted-foreground">
                  +{Math.max(0, visits.length - 3)} {t('morning.moreStops')}
                </p>
              </div>

              <Button
                onClick={() => completeStep(4)}
                className="w-full h-12 bg-gradient-brand hover:opacity-90"
              >
                {t('morning.startTour')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </div>
    </AppLayout>
  );
};

export default MorningFlow;
