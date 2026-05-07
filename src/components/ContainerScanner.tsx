import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, CheckCircle2, X, Plus, Camera, ArrowDownToLine, ArrowUpFromLine, PackageOpen, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { getScannerFailure, ScannerResult, scannerService } from '@/services/device/scanner';

export interface ScannedContainer {
  id: string;
  type: string;
  direction: 'pickup' | 'dropoff';
  scannedAt: string;
  format?: string;
  scanSource?: ScannerResult['source'];
}

export interface OtherContainer {
  label: string;
  count: number;
}

interface ContainerScannerProps {
  scannedContainers: ScannedContainer[];
  onScan: (container: ScannedContainer) => void;
  onRemove: (id: string) => void;
  otherContainers: OtherContainer[];
  onOtherContainersChange: (containers: OtherContainer[]) => void;
  hideOtherContainers?: boolean;
}

const PRESET_OTHER_CONTAINERS = [
  'Kanister',
  'Eimer',
  'Fass',
  'IBC-Container',
];

const ContainerScanner = ({ scannedContainers, onScan, onRemove, otherContainers, onOtherContainersChange, hideOtherContainers }: ContainerScannerProps) => {
  const { t } = useLanguage();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanDirection, setScanDirection] = useState<'pickup' | 'dropoff'>('pickup');
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const pickupContainers = scannedContainers.filter(c => c.direction === 'pickup');
  const dropoffContainers = scannedContainers.filter(c => c.direction === 'dropoff');

  const formatScanTime = (scannedAt: string) =>
    new Date(scannedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const addScannedContainer = (result: ScannerResult, direction: 'pickup' | 'dropoff') => {
    onScan({
      id: result.code,
      type: 'Recycling-Behälter',
      direction,
      scannedAt: formatScanTime(result.scannedAt),
      format: result.format,
      scanSource: result.source,
    });
  };

  const closeCamera = () => {
    setCameraOpen(false);
    setIsScanning(false);
    setManualCode('');
    setScanMessage(null);
  };

  const openCamera = async (direction: 'pickup' | 'dropoff') => {
    setScanDirection(direction);
    setCameraOpen(true);
    setIsScanning(true);
    setManualCode('');
    setScanMessage(null);

    try {
      const result = await scannerService.scanCode();
      addScannedContainer(result, direction);
      closeCamera();
    } catch (error) {
      const failure = getScannerFailure(error);
      setScanMessage(failure.message);
      setCameraOpen(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = () => {
    try {
      const result = scannerService.createManualResult(manualCode);
      addScannedContainer(result, scanDirection);
      closeCamera();
    } catch (error) {
      setScanMessage(getScannerFailure(error).message);
    }
  };

  const ContainerList = ({ items, emptyText }: { items: ScannedContainer[]; emptyText: string }) => (
    <div className="space-y-2 min-h-[40px]">
      <AnimatePresence>
        {items.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-semibold text-foreground">{c.id}</p>
                <p className="text-[10px] text-muted-foreground">{c.scannedAt}</p>
              </div>
            </div>
            <button onClick={() => onRemove(c.id)} className="p-1 rounded-full hover:bg-muted">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {items.length === 0 && (
        <p className="text-[11px] text-muted-foreground text-center py-2">{emptyText}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Pickup containers (taking from customer) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpFromLine className="w-4 h-4 text-amber-600" />
          <h4 className="text-xs font-semibold text-foreground">{t('scanner.pickup')} <span className="text-muted-foreground font-normal">{t('scanner.pickupSub')}</span></h4>
        </div>
        <ContainerList items={pickupContainers} emptyText={t('scanner.noPickup')} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => openCamera('pickup')}
          className="w-full mt-2 h-9 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Camera className="w-3.5 h-3.5 mr-1.5" />
          {t('scanner.scanPickup')}
        </Button>
      </div>

      {!hideOtherContainers && (
        <>
          <div className="border-t border-border" />
          {/* Other (non-scannable) containers */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PackageOpen className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-xs font-semibold text-foreground">{t('scanner.otherContainers')} <span className="text-muted-foreground font-normal">{t('scanner.noQr')}</span></h4>
            </div>
            <div className="space-y-2">
              {PRESET_OTHER_CONTAINERS.map((label) => {
                const existing = otherContainers.find(c => c.label === label);
                const count = existing?.count || 0;
                return (
                  <div key={label} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (count <= 0) return;
                          const updated = otherContainers.map(c => c.label === label ? { ...c, count: c.count - 1 } : c).filter(c => c.count > 0);
                          onOtherContainersChange(updated);
                        }}
                        disabled={count <= 0}
                        className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5 text-foreground" />
                      </button>
                      <span className="text-sm font-bold text-foreground w-6 text-center tabular-nums">{count}</span>
                      <button
                        onClick={() => {
                          const exists = otherContainers.find(c => c.label === label);
                          if (exists) {
                            onOtherContainersChange(otherContainers.map(c => c.label === label ? { ...c, count: c.count + 1 } : c));
                          } else {
                            onOtherContainersChange([...otherContainers, { label, count: 1 }]);
                          }
                        }}
                        className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Dropoff containers (giving to customer) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ArrowDownToLine className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground">{t('scanner.dropoff')} <span className="text-muted-foreground font-normal">{t('scanner.dropoffSub')}</span></h4>
        </div>
        <ContainerList items={dropoffContainers} emptyText={t('scanner.noDropoff')} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => openCamera('dropoff')}
          className="w-full mt-2 h-9 border-dashed border-primary/40 text-primary hover:bg-primary/5"
        >
          <Camera className="w-3.5 h-3.5 mr-1.5" />
          {t('scanner.scanDropoff')}
        </Button>
      </div>

      {/* Camera overlay */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Camera viewfinder */}
            <div className="flex-1 relative bg-black">
              {/* Scan frame overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-lg" />
                  <motion.div
                    className="absolute left-4 right-4 h-0.5 bg-primary/70"
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </div>
              {/* Direction badge */}
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className={`px-4 py-2 rounded-full backdrop-blur-md text-sm font-semibold ${
                  scanDirection === 'pickup'
                    ? 'bg-amber-500/80 text-white'
                    : 'bg-primary/80 text-white'
                }`}>
                  {scanDirection === 'pickup' ? t('scanner.cameraPickupLabel') : t('scanner.cameraDropoffLabel')}
                </div>
              </div>

              <div className="absolute bottom-8 left-6 right-6 space-y-3">
                {isScanning && (
                  <p className="text-center text-sm font-medium text-white/80">Scanner wird gestartet...</p>
                )}
                {scanMessage && (
                  <div className="rounded-2xl bg-white/95 p-3 text-center text-sm font-medium text-foreground shadow-lg">
                    {scanMessage}
                  </div>
                )}
                {!isScanning && (
                  <div className="rounded-2xl bg-white/95 p-3 shadow-lg">
                    <p className="mb-2 text-xs font-semibold text-foreground">Manuelle Eingabe</p>
                    <div className="flex gap-2">
                      <Input
                        value={manualCode}
                        onChange={(event) => setManualCode(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            handleManualSubmit();
                          }
                        }}
                        placeholder="Behältercode"
                        className="h-10 bg-background"
                      />
                      <Button onClick={handleManualSubmit} size="sm" className="h-10">
                        OK
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom controls */}
            <div className="bg-black/90 backdrop-blur-sm px-6 py-6 flex items-center justify-between">
              <button onClick={closeCamera} className="text-white/70 text-sm font-medium px-4 py-2">
                {t('scanner.cancel')}
              </button>
              <button
                onClick={() => openCamera(scanDirection)}
                disabled={isScanning}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-60"
              >
                <QrCode className="w-7 h-7 text-black" />
              </button>
              <div className="w-20" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContainerScanner;
