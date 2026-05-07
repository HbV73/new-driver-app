import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, QrCode, CheckCircle2, Upload, RotateCcw } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getScannerFailure, scannerService } from '@/services/device/scanner';
import { cameraService, getCameraFailure, type CapturedPhoto } from '@/services/device/camera';

const ScanPage = () => {
  const [step, setStep] = useState<'scan' | 'photo_before' | 'photo_after' | 'done'>('scan');
  const [scannedBin, setScannedBin] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [beforePhoto, setBeforePhoto] = useState<CapturedPhoto | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<CapturedPhoto | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    setScanMessage(null);

    try {
      const result = await scannerService.scanCode();
      setScannedBin(result.code);
      setStep('photo_before');
    } catch (error) {
      setScanMessage(getScannerFailure(error).message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualScan = () => {
    try {
      const result = scannerService.createManualResult(manualCode);
      setScannedBin(result.code);
      setManualCode('');
      setScanMessage(null);
      setStep('photo_before');
    } catch (error) {
      setScanMessage(getScannerFailure(error).message);
    }
  };

  const handlePhoto = async () => {
    setIsCapturing(true);
    setPhotoMessage(null);
    try {
      const photo = await cameraService.capturePhoto({ filenamePrefix: step });
      if (step === 'photo_before') {
        setBeforePhoto(photo);
        setStep('photo_after');
      } else {
        setAfterPhoto(photo);
        setStep('done');
      }
    } catch (error) {
      const failure = getCameraFailure(error);
      if (failure.reason !== 'cancelled') {
        setPhotoMessage(failure.message);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <AppLayout>
      <AppHeader title="Scanner" showBack />

      <div className="px-4 pt-6 space-y-6">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2">
          {['Scan', 'Vorher', 'Nachher'].map((label, i) => {
            const stepIndex = ['scan', 'photo_before', 'photo_after', 'done'].indexOf(step);
            const isActive = i <= stepIndex;
            const isCurrent = i === stepIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                } ${isCurrent ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background' : ''}`}>
                  {i + 1}
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                {i < 2 && <div className={`w-8 h-0.5 ${isActive ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            );
          })}
        </div>

        {step === 'scan' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            {/* Scanner viewport */}
            <div className="relative mx-auto w-64 h-64 bg-muted/50 rounded-3xl overflow-hidden border-2 border-dashed border-primary/30">
              <div className="absolute inset-8 border-2 border-primary/50 rounded-xl" />
              <motion.div
                className="absolute left-8 right-8 h-0.5 bg-primary/70"
                animate={{ top: ['2rem', '14rem', '2rem'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-primary/20" />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">QR-Code scannen</p>
              <p className="text-xs text-muted-foreground mt-1">Halten Sie den QR-Code des Behälters in den Rahmen</p>
            </div>

            {scanMessage && (
              <div className="rounded-xl bg-muted p-3 text-sm font-medium text-foreground">
                {scanMessage}
              </div>
            )}

            {scanMessage && (
              <div className="flex gap-2">
                <Input
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleManualScan();
                    }
                  }}
                  placeholder="Behältercode"
                  className="h-12 rounded-xl"
                />
                <Button onClick={handleManualScan} className="h-12 rounded-xl">
                  OK
                </Button>
              </div>
            )}

            <Button onClick={handleScan} disabled={isScanning} className="w-full h-12 rounded-xl bg-gradient-brand">
              <QrCode className="w-5 h-5 mr-2" />
              {isScanning ? 'Scanner wird gestartet...' : 'QR-Code scannen'}
            </Button>
          </motion.div>
        )}

        {(step === 'photo_before' || step === 'photo_after') && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-5"
          >
            {scannedBin && (
              <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{scannedBin}</p>
                  <p className="text-[11px] text-muted-foreground">Behälter erkannt</p>
                </div>
              </div>
            )}

            <div className="relative mx-auto w-64 h-64 bg-muted/50 rounded-3xl overflow-hidden border-2 border-border flex items-center justify-center">
              {(step === 'photo_before' ? beforePhoto : afterPhoto)?.webPath ? (
                <img
                  src={(step === 'photo_before' ? beforePhoto : afterPhoto)?.webPath}
                  alt="Dokumentation"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-16 h-16 text-muted-foreground/30" />
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">
                {step === 'photo_before' ? 'Foto VOR der Abholung' : 'Foto NACH der Abholung'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {step === 'photo_before' ? 'Dokumentieren Sie den Zustand vorher' : 'Dokumentieren Sie den Zustand nachher'}
              </p>
            </div>

            {photoMessage && (
              <div className="rounded-xl bg-muted p-3 text-sm font-medium text-foreground">
                {photoMessage}
              </div>
            )}

            <Button onClick={() => void handlePhoto()} disabled={isCapturing} className="w-full h-12 rounded-xl bg-gradient-brand">
              <Camera className="w-5 h-5 mr-2" />
              {isCapturing ? 'Kamera wird gestartet...' : 'Foto aufnehmen'}
            </Button>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </motion.div>
            <div>
              <p className="text-lg font-bold text-foreground">Fertig!</p>
              <p className="text-sm text-muted-foreground mt-1">Behälter {scannedBin} dokumentiert</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('scan'); setScannedBin(null); setBeforePhoto(null); setAfterPhoto(null); }} className="flex-1 h-11 rounded-xl">
                <RotateCcw className="w-4 h-4 mr-2" />
                Nächster
              </Button>
              <Button onClick={() => window.history.back()} className="flex-1 h-11 rounded-xl bg-gradient-brand">
                Zurück
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default ScanPage;
