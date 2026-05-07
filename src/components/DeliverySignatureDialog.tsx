import { useState } from 'react';
import { PenLine, Plus, Trash2, MapPin } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SignaturePad from '@/components/SignaturePad';
import { useDeliverySignatures, type SignaturePurpose } from '@/hooks/useDeliverySignatures';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { locationService } from '@/services/device/location';

interface Props {
  visitRef?: string | null;
  customerName?: string;
  defaultPurpose?: SignaturePurpose;
  trigger?: React.ReactNode;
  onSaved?: () => void;
}

interface Item { label: string; qty: number; price: number }

const DeliverySignatureDialog = ({ visitRef, customerName = '', defaultPurpose = 'fresh_food_delivery', trigger, onSaved }: Props) => {
  const { t } = useLanguage();
  const { create } = useDeliverySignatures();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState<SignaturePurpose>(defaultPurpose);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Item[]>([{ label: '', qty: 1, price: 0 }]);
  const [signature, setSignature] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);

  const captureGps = async () => {
    const location = await locationService.getCurrentLocation({ enableHighAccuracy: true, timeout: 8000 });
    if (location) {
      setCoords({ lat: location.latitude, lng: location.longitude });
    }
  };

  const reset = () => {
    setSignerName(''); setSignerRole(''); setNotes('');
    setItems([{ label: '', qty: 1, price: 0 }]);
    setSignature(null); setCoords(null);
  };

  const handleSubmit = async () => {
    if (!signature) { toast.error(t('sig.required') || 'Signature required'); return; }
    if (!signerName.trim()) { toast.error(t('sig.nameRequired') || 'Signer name required'); return; }
    setSubmitting(true);
    try {
      await create({
        visit_ref: visitRef ?? null,
        customer_name: customerName || signerName,
        purpose,
        signer_name: signerName.trim(),
        signer_role: signerRole.trim(),
        signature_data: signature,
        items_summary: items.filter(i => i.label.trim()).map(i => ({ label: i.label, qty: i.qty, price_eur: i.price })),
        total_amount_eur: total > 0 ? total : null,
        notes,
        gps_lat: coords?.lat ?? null,
        gps_lng: coords?.lng ?? null,
      });
      toast.success(t('sig.saved') || 'Signature saved');
      setOpen(false); reset(); onSaved?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) captureGps(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <PenLine className="w-4 h-4" /> {t('sig.dialogTitle') || 'Digitale Unterschrift'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-primary" />
            {t('sig.dialogTitle') || 'Digitale Unterschrift'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>{t('sig.purpose') || 'Zweck'}</Label>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as SignaturePurpose)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fresh_food_delivery">{t('sig.purpose.fresh') || 'Frischware-Lieferung'}</SelectItem>
                <SelectItem value="oil_collection">{t('sig.purpose.oil') || 'Öl-Abholung'}</SelectItem>
                <SelectItem value="bin_handover">{t('sig.purpose.bin') || 'Behälter-Übergabe'}</SelectItem>
                <SelectItem value="damage_acknowledgement">{t('sig.purpose.damage') || 'Schaden-Bestätigung'}</SelectItem>
                <SelectItem value="other">{t('common.other') || 'Sonstiges'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{t('sig.signerName') || 'Name (Empfänger)'}</Label>
              <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} />
            </div>
            <div>
              <Label>{t('sig.signerRole') || 'Funktion'}</Label>
              <Input value={signerRole} onChange={(e) => setSignerRole(e.target.value)} placeholder={t('sig.rolePlaceholder') || 'z.B. Küchenchef'} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('sig.items') || 'Gelieferte Artikel'}</Label>
              <Button type="button" size="sm" variant="ghost" onClick={() => setItems([...items, { label: '', qty: 1, price: 0 }])}>
                <Plus className="w-3.5 h-3.5 mr-1" /> {t('common.add') || 'Hinzufügen'}
              </Button>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-1 items-center">
                <Input className="col-span-6" placeholder={t('sig.itemLabel') || 'Artikel'} value={it.label}
                  onChange={(e) => { const c = [...items]; c[idx].label = e.target.value; setItems(c); }} />
                <Input className="col-span-2" type="number" placeholder="Qty" value={it.qty}
                  onChange={(e) => { const c = [...items]; c[idx].qty = Number(e.target.value); setItems(c); }} />
                <Input className="col-span-3" type="number" placeholder="€" value={it.price}
                  onChange={(e) => { const c = [...items]; c[idx].price = Number(e.target.value); setItems(c); }} />
                <Button type="button" variant="ghost" size="icon" className="col-span-1 h-8 w-8"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            {total > 0 && (
              <div className="text-right text-sm font-semibold">{t('sig.total') || 'Summe'}: {total.toFixed(2)} €</div>
            )}
          </div>

          <div>
            <Label>{t('common.notes') || 'Notiz'}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {coords && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </div>
          )}

          <div>
            <Label className="mb-2 block">{t('sig.padLabel') || 'Unterschrift hier'}</Label>
            <SignaturePad onSave={(d) => setSignature(d)} />
            {signature && <p className="text-xs text-emerald-600 mt-1">✓ {t('sig.captured') || 'Unterschrift erfasst'}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel') || 'Abbrechen'}</Button>
          <Button onClick={handleSubmit} disabled={submitting || !signature}>
            {submitting ? '…' : (t('common.save') || 'Speichern')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliverySignatureDialog;
