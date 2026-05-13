import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Check, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/components/AppLayout';
import AppHeader from '@/components/AppHeader';
import SignaturePad from '@/components/SignaturePad';
import OdometerPhotoCapture from '@/components/OdometerPhotoCapture';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { syncOrQueue } from '@/lib/offlineQueue';
import { sendPlatformEvent } from '@/lib/platformSync';
import { useKmDeviationCheck } from '@/hooks/useKmDeviationCheck';
import { toast } from 'sonner';

const provider = import.meta.env.VITE_DRIVER_API_PROVIDER ?? 'supabase';
const REST_PRETRIP_KEY = 'rs_rest_pretrip_today';

type ChecklistKey =
  | 'brakes_ok' | 'tires_ok' | 'lights_ok' | 'oil_level_ok'
  | 'adblue_ok' | 'body_damage_ok' | 'first_aid_kit_ok'
  | 'fire_extinguisher_ok' | 'reflective_vest_ok' | 'warning_triangle_ok';

const ITEMS: { key: ChecklistKey; tKey: string; safety: boolean }[] = [
  { key: 'brakes_ok', tKey: 'inspect.brakes', safety: true },
  { key: 'tires_ok', tKey: 'inspect.tires', safety: true },
  { key: 'lights_ok', tKey: 'inspect.lights', safety: true },
  { key: 'oil_level_ok', tKey: 'inspect.oil', safety: false },
  { key: 'adblue_ok', tKey: 'inspect.adblue', safety: false },
  { key: 'body_damage_ok', tKey: 'inspect.body', safety: false },
  { key: 'first_aid_kit_ok', tKey: 'inspect.firstAid', safety: true },
  { key: 'fire_extinguisher_ok', tKey: 'inspect.fireExt', safety: true },
  { key: 'reflective_vest_ok', tKey: 'inspect.vest', safety: true },
  { key: 'warning_triangle_ok', tKey: 'inspect.triangle', safety: true },
];

const PreTripInspection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [signature, setSignature] = useState<string | null>(null);

  const [checks, setChecks] = useState<Record<ChecklistKey, boolean>>(
    Object.fromEntries(ITEMS.map(i => [i.key, false])) as Record<ChecklistKey, boolean>,
  );
  const [startKm, setStartKm] = useState('');
  const [fuel, setFuel] = useState('');
  const [defects, setDefects] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [odometerPhoto, setOdometerPhoto] = useState<{ url: string; lat: number | null; lng: number | null; takenAt: string } | null>(null);
  const [fuelPhoto, setFuelPhoto] = useState<{ url: string; lat: number | null; lng: number | null; takenAt: string } | null>(null);

  const { check: checkKmDeviation } = useKmDeviationCheck(30);

  const safetyAllOk = ITEMS.filter(i => i.safety).every(i => checks[i.key]);
  const allOk = ITEMS.every(i => checks[i.key]);
  const blocked = !safetyAllOk && !defects.trim();
  const photoMissing = !odometerPhoto;

  const handleSubmit = async () => {
    if (blocked) {
      toast.error(t('inspect.required'));
      return;
    }
    if (photoMissing) {
      toast.error(t('photo.required'));
      return;
    }
    const sig = signature;
    setSubmitting(true);
    try {
      if (provider === 'rest') {
        const today = new Date().toISOString().slice(0, 10);
        const startKmNum = startKm ? Number(startKm) : null;
        const payload = {
          log_date: today,
          ...checks,
          start_km: startKmNum,
          fuel_level_percent: fuel ? Number(fuel) : null,
          signature_data: signature,
          defects_noted: defects,
          blocked_from_driving: !allOk,
          odometer_photo_url: odometerPhoto?.url ?? null,
          fuel_gauge_photo_url: fuelPhoto?.url ?? null,
          odometer_photo_gps_lat: odometerPhoto?.lat ?? null,
          odometer_photo_gps_lng: odometerPhoto?.lng ?? null,
          odometer_photo_taken_at: odometerPhoto?.takenAt ?? null,
        };
        localStorage.setItem(REST_PRETRIP_KEY, JSON.stringify(payload));
        toast.success(allOk ? '✓ Check abgeschlossen' : '⚠️ Mängel gemeldet');
        void sendPlatformEvent('override', today, {
          type: 'pre_trip_inspection',
          all_ok: allOk,
          defects: defects || null,
          odometer_photo_url: odometerPhoto?.url ?? null,
          fuel_gauge_photo_url: fuelPhoto?.url ?? null,
          provider: 'rest-local-cache',
        });
        navigate('/work-time');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Auth error'); return; }
      const today = new Date().toISOString().slice(0, 10);
      const startKmNum = startKm ? Number(startKm) : null;

      const payload = {
        user_id: user.id,
        log_date: today,
        ...checks,
        start_km: startKmNum,
        fuel_level_percent: fuel ? Number(fuel) : null,
        signature_data: sig,
        defects_noted: defects,
        blocked_from_driving: !allOk,
        odometer_photo_url: odometerPhoto?.url ?? null,
        fuel_gauge_photo_url: fuelPhoto?.url ?? null,
        odometer_photo_gps_lat: odometerPhoto?.lat ?? null,
        odometer_photo_gps_lng: odometerPhoto?.lng ?? null,
        odometer_photo_taken_at: odometerPhoto?.takenAt ?? null,
      };

      const res = await syncOrQueue(user.id, 'upsert', 'pre_trip_inspections', payload);
      if (res.queued) {
        toast.success('Offline – wird synchronisiert');
      } else {
        toast.success(allOk ? '✓ Check abgeschlossen' : '⚠️ Mängel gemeldet');
      }

      void sendPlatformEvent('override', today, {
        type: 'pre_trip_inspection',
        all_ok: allOk,
        defects: defects || null,
        odometer_photo_url: odometerPhoto?.url ?? null,
        fuel_gauge_photo_url: fuelPhoto?.url ?? null,
      });

      // KM deviation check vs yesterday's end_km
      if (startKmNum != null) {
        const dev = await checkKmDeviation(startKmNum);
        if (dev.hasDeviation) {
          toast.warning(
            t('kmDev.detected').replace('{km}', String(dev.deviationKm)),
            { duration: 6000 },
          );
        }
      }

      navigate('/work-time');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <AppHeader title={t('inspect.title')} showBack onBack={() => navigate(-1)} />
      <div className="px-4 pb-24 pt-2 space-y-4 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="w-4 h-4" /> Zurück
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{t('inspect.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('inspect.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        {/* Checklist */}
        <div className="rounded-2xl bg-card border border-border/50 divide-y divide-border/40">
          {ITEMS.map((item, idx) => (
            <motion.label
              key={item.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  checks[item.key] ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {checks[item.key] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <span className="text-sm">
                  {t(item.tKey as Parameters<typeof t>[0])}
                  {item.safety && <span className="ml-1 text-destructive">*</span>}
                </span>
              </div>
              <Switch
                checked={checks[item.key]}
                onCheckedChange={(v) => setChecks(c => ({ ...c, [item.key]: v }))}
              />
            </motion.label>
          ))}
        </div>

        {/* KM + Fuel */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">{t('inspect.startKm')}</label>
            <Input
              type="number"
              inputMode="numeric"
              value={startKm}
              onChange={(e) => setStartKm(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('inspect.fuel')}</label>
            <Input
              type="number"
              inputMode="numeric"
              max={100}
              min={0}
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
              placeholder="0–100"
            />
          </div>
        </div>

        {/* Odometer + Fuel photos */}
        <OdometerPhotoCapture
          label={t('photo.odometer') + ' *'}
          hint={t('photo.odometerHint')}
          folder="odometer"
          value={odometerPhoto?.url}
          onCaptured={setOdometerPhoto}
          onClear={() => setOdometerPhoto(null)}
        />
        <OdometerPhotoCapture
          label={t('photo.fuel')}
          hint={t('photo.fuelHint')}
          folder="fuel"
          value={fuelPhoto?.url}
          onCaptured={setFuelPhoto}
          onClear={() => setFuelPhoto(null)}
        />

        {/* Defects */}
        <div>
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            {t('inspect.defects')}
            {!safetyAllOk && <span className="text-destructive">*</span>}
          </label>
          <Textarea
            value={defects}
            onChange={(e) => setDefects(e.target.value)}
            placeholder={t('inspect.defectsPlaceholder')}
            rows={3}
          />
        </div>

        {/* Block warning */}
        {!allOk && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t('inspect.blocked')}</span>
          </motion.div>
        )}

        {/* Signature */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t('inspect.signature')}</label>
          <SignaturePad onSave={setSignature} />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || blocked}
          className="w-full h-12 text-base"
        >
          {submitting ? '…' : t('inspect.confirm')}
        </Button>
      </div>
    </AppLayout>
  );
};

export default PreTripInspection;
