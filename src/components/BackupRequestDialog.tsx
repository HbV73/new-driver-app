import { useState } from 'react';
import { LifeBuoy, MapPin, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBackupRequests, type BackupKind, type BackupUrgency } from '@/hooks/useBackupRequests';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { locationService } from '@/services/device/location';

interface Props { trigger?: React.ReactNode }

const BackupRequestDialog = ({ trigger }: Props) => {
  const { t } = useLanguage();
  const { create } = useBackupRequests();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<BackupKind>('extra_driver');
  const [urgency, setUrgency] = useState<BackupUrgency>('normal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [delay, setDelay] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const captureGps = async () => {
    const location = await locationService.getCurrentLocation({ enableHighAccuracy: true, timeout: 8000 });
    if (location) {
      setCoords({ lat: location.latitude, lng: location.longitude });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error(t('backup.titleRequired') || 'Titel erforderlich'); return; }
    setSubmitting(true);
    try {
      await create({
        kind, urgency,
        title: title.trim(),
        description: description.trim(),
        current_lat: coords?.lat ?? null,
        current_lng: coords?.lng ?? null,
        estimated_delay_minutes: delay ? Number(delay) : null,
      });
      toast.success(t('backup.sent') || 'Backup-Anfrage gesendet');
      setOpen(false);
      setTitle(''); setDescription(''); setDelay(''); setKind('extra_driver'); setUrgency('normal');
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) captureGps(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <LifeBuoy className="w-4 h-4" /> {t('backup.request') || 'Hilfe anfordern'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-amber-500" />
            {t('backup.dialogTitle') || 'Backup / Hilfe anfordern'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label>{t('backup.kind') || 'Art der Hilfe'}</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as BackupKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="extra_driver">{t('backup.kind.driver') || 'Zusätzlicher Fahrer'}</SelectItem>
                <SelectItem value="vehicle_swap">{t('backup.kind.vehicle') || 'Fahrzeug-Wechsel'}</SelectItem>
                <SelectItem value="fuel">{t('backup.kind.fuel') || 'Kraftstoff/Pannenhilfe'}</SelectItem>
                <SelectItem value="tool_equipment">{t('backup.kind.tool') || 'Werkzeug/Ausrüstung'}</SelectItem>
                <SelectItem value="translator">{t('backup.kind.translator') || 'Dolmetscher'}</SelectItem>
                <SelectItem value="medical">{t('backup.kind.medical') || 'Medizinische Hilfe'}</SelectItem>
                <SelectItem value="other">{t('common.other') || 'Sonstiges'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('backup.urgency') || 'Dringlichkeit'}</Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as BackupUrgency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('backup.urg.low') || 'Niedrig'}</SelectItem>
                <SelectItem value="normal">{t('backup.urg.normal') || 'Normal'}</SelectItem>
                <SelectItem value="high">{t('backup.urg.high') || 'Hoch'}</SelectItem>
                <SelectItem value="critical">{t('backup.urg.critical') || 'Kritisch'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('backup.title') || 'Kurze Überschrift'}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('backup.titlePh') || 'z.B. Reifenpanne A2'} />
          </div>

          <div>
            <Label>{t('common.description') || 'Beschreibung'}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div>
            <Label>{t('backup.delay') || 'Geschätzte Verspätung (Min.)'}</Label>
            <Input type="number" value={delay} onChange={(e) => setDelay(e.target.value)} />
          </div>

          {coords && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </div>
          )}

          {urgency === 'critical' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-xs text-red-600 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {t('backup.criticalNote') || 'Bei Lebensgefahr zuerst 112 anrufen!'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel') || 'Abbrechen'}</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '…' : (t('backup.send') || 'Senden')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackupRequestDialog;
