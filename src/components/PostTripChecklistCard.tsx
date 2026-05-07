import { useState, useEffect } from 'react';
import { CheckCircle2, Lock, Snowflake, Trash2, FileCheck, Key, AlertTriangle, Euro } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import SignaturePad from '@/components/SignaturePad';
import OdometerPhotoCapture from '@/components/OdometerPhotoCapture';
import { usePostTripChecklist } from '@/hooks/usePostTripChecklist';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Item { key: keyof CheckState; icon: React.ComponentType<{ className?: string }>; label: string; required?: boolean }

interface CheckState {
  vehicle_locked: boolean;
  fridge_off: boolean;
  cargo_area_clean: boolean;
  bins_returned: boolean;
  paperwork_submitted: boolean;
  keys_handed_over: boolean;
  adblue_refilled: boolean;
}

const PostTripChecklistCard = ({ onCompleted }: { onCompleted?: () => void }) => {
  const { t } = useLanguage();
  const { item, submit } = usePostTripChecklist();
  const [state, setState] = useState<CheckState>({
    vehicle_locked: false, fridge_off: false, cargo_area_clean: false,
    bins_returned: false, paperwork_submitted: false, keys_handed_over: false, adblue_refilled: false,
  });
  const [endKm, setEndKm] = useState<string>('');
  const [fuelPercent, setFuelPercent] = useState<string>('');
  const [damageNoticed, setDamageNoticed] = useState(false);
  const [damageDesc, setDamageDesc] = useState('');
  const [cashHanded, setCashHanded] = useState(false);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [odometerPhoto, setOdometerPhoto] = useState<{ url: string; lat: number | null; lng: number | null; takenAt: string } | null>(null);
  const [fuelPhoto, setFuelPhoto] = useState<{ url: string; lat: number | null; lng: number | null; takenAt: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setState({
        vehicle_locked: item.vehicle_locked, fridge_off: item.fridge_off,
        cargo_area_clean: item.cargo_area_clean, bins_returned: item.bins_returned,
        paperwork_submitted: item.paperwork_submitted, keys_handed_over: item.keys_handed_over,
        adblue_refilled: item.adblue_refilled,
      });
      setEndKm(item.end_km?.toString() ?? '');
      setFuelPercent(item.fuel_level_percent?.toString() ?? '');
      setDamageNoticed(item.damage_noticed); setDamageDesc(item.damage_description ?? '');
      setCashHanded(item.cash_handed_over); setCashAmount(item.cash_amount_eur?.toString() ?? '');
      setNotes(item.notes ?? ''); setSignature(item.signature_data);
    }
  }, [item]);

  const items: Item[] = [
    { key: 'vehicle_locked', icon: Lock, label: t('postTrip.locked') || 'Fahrzeug abgeschlossen', required: true },
    { key: 'fridge_off', icon: Snowflake, label: t('postTrip.fridge') || 'Kühlung ausgeschaltet' },
    { key: 'cargo_area_clean', icon: Trash2, label: t('postTrip.cargo') || 'Laderaum gereinigt' },
    { key: 'bins_returned', icon: Trash2, label: t('postTrip.bins') || 'Behälter zurückgebracht' },
    { key: 'paperwork_submitted', icon: FileCheck, label: t('postTrip.paperwork') || 'Belege abgegeben' },
    { key: 'keys_handed_over', icon: Key, label: t('postTrip.keys') || 'Schlüssel übergeben', required: true },
    { key: 'adblue_refilled', icon: CheckCircle2, label: t('postTrip.adblue') || 'AdBlue aufgefüllt (falls nötig)' },
  ];

  const completedCount = Object.values(state).filter(Boolean).length;
  const requiredOk = state.vehicle_locked && state.keys_handed_over;

  const handleSubmit = async () => {
    if (!requiredOk) { toast.error(t('postTrip.requiredMissing') || 'Pflichtpunkte nicht erfüllt'); return; }
    if (!odometerPhoto && !item?.odometer_photo_url) { toast.error(t('photo.required')); return; }
    setSubmitting(true);
    try {
      await submit({
        ...state,
        end_km: endKm ? Number(endKm) : null,
        fuel_level_percent: fuelPercent ? Number(fuelPercent) : null,
        damage_noticed: damageNoticed,
        damage_description: damageDesc,
        cash_handed_over: cashHanded,
        cash_amount_eur: cashAmount ? Number(cashAmount) : null,
        notes,
        signature_data: signature,
        odometer_photo_url: odometerPhoto?.url ?? item?.odometer_photo_url ?? null,
        fuel_gauge_photo_url: fuelPhoto?.url ?? item?.fuel_gauge_photo_url ?? null,
        odometer_photo_gps_lat: odometerPhoto?.lat ?? null,
        odometer_photo_gps_lng: odometerPhoto?.lng ?? null,
      });
      toast.success(t('postTrip.saved') || 'Schicht-Abschluss gespeichert');
      onCompleted?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            {t('postTrip.title') || 'Schicht-Abschluss'}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map(({ key, icon: Icon, label, required }) => (
            <label key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
              <Checkbox checked={state[key]} onCheckedChange={(v) => setState({ ...state, [key]: !!v })} />
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{label}{required && <span className="text-red-500 ml-1">*</span>}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>{t('postTrip.endKm') || 'End-KM'}</Label>
            <Input type="number" value={endKm} onChange={(e) => setEndKm(e.target.value)} />
          </div>
          <div>
            <Label>{t('postTrip.fuel') || 'Tank %'}</Label>
            <Input type="number" min={0} max={100} value={fuelPercent} onChange={(e) => setFuelPercent(e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={damageNoticed} onCheckedChange={(v) => setDamageNoticed(!!v)} />
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {t('postTrip.damage') || 'Neue Schäden bemerkt'}
          </label>
          {damageNoticed && (
            <Textarea placeholder={t('postTrip.damagePh') || 'Beschreibung'} value={damageDesc}
              onChange={(e) => setDamageDesc(e.target.value)} rows={2} />
          )}
        </div>

        <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={cashHanded} onCheckedChange={(v) => setCashHanded(!!v)} />
            <Euro className="w-4 h-4 text-emerald-600" />
            {t('postTrip.cash') || 'Bargeld übergeben'}
          </label>
          {cashHanded && (
            <Input type="number" placeholder="€" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
          )}
        </div>

        <OdometerPhotoCapture
          label={t('photo.odometer') + ' *'}
          hint={t('photo.odometerHint')}
          folder="odometer-end"
          value={odometerPhoto?.url ?? item?.odometer_photo_url ?? null}
          onCaptured={setOdometerPhoto}
          onClear={() => setOdometerPhoto(null)}
        />
        <OdometerPhotoCapture
          label={t('photo.fuel')}
          hint={t('photo.fuelHint')}
          folder="fuel-end"
          value={fuelPhoto?.url ?? item?.fuel_gauge_photo_url ?? null}
          onCaptured={setFuelPhoto}
          onClear={() => setFuelPhoto(null)}
        />

        <div>
          <Label>{t('common.notes') || 'Notizen'}</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <div>
          <Label className="mb-2 block">{t('postTrip.signature') || 'Fahrer-Unterschrift'}</Label>
          <SignaturePad onSave={(d) => { setSignature(d); toast.success(t('sig.captured') || 'Signature captured'); }} />
          {signature && <p className="text-xs text-emerald-600 mt-1">✓ {t('sig.captured') || 'erfasst'}</p>}
        </div>

        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || !requiredOk}>
          {submitting ? '…' : (item ? (t('postTrip.update') || 'Aktualisieren') : (t('postTrip.complete') || 'Schicht abschließen'))}
        </Button>
        {item && <p className="text-xs text-center text-muted-foreground">✓ {t('postTrip.alreadyDone') || 'Bereits eingereicht — Aktualisierung möglich'}</p>}
      </CardContent>
    </Card>
  );
};

export default PostTripChecklistCard;
