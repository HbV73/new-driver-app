import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Camera, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDamageReports, type DamageItemType, type DamageCause } from '@/hooks/useDamageReports';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { locationService } from '@/services/device/location';

interface Props {
  open: boolean;
  onClose: () => void;
  visitRef?: string | null;
  customerName?: string | null;
}

const ITEM_TYPES: { id: DamageItemType; emojiDe: string; labelDe: string; labelEn: string }[] = [
  { id: 'bin', emojiDe: '🛢️', labelDe: 'Ölbehälter (Dibbe)', labelEn: 'Oil bin' },
  { id: 'barrel_60', emojiDe: '🛢️', labelDe: 'Fass 60 L', labelEn: 'Barrel 60 L' },
  { id: 'barrel_30', emojiDe: '🛢️', labelDe: 'Fass 30 L', labelEn: 'Barrel 30 L' },
  { id: 'fresh_food', emojiDe: '🥬', labelDe: 'Frische Ware', labelEn: 'Fresh food' },
  { id: 'product', emojiDe: '📦', labelDe: 'Produkt', labelEn: 'Product' },
  { id: 'other', emojiDe: '❓', labelDe: 'Sonstiges', labelEn: 'Other' },
];

const CAUSES: { id: DamageCause; labelDe: string; labelEn: string }[] = [
  { id: 'drop', labelDe: 'Heruntergefallen', labelEn: 'Dropped' },
  { id: 'collision', labelDe: 'Stoß / Aufprall', labelEn: 'Collision' },
  { id: 'wear', labelDe: 'Verschleiß / alt', labelEn: 'Wear / old' },
  { id: 'spoiled', labelDe: 'Verdorben', labelEn: 'Spoiled' },
  { id: 'temperature', labelDe: 'Temperatur', labelEn: 'Temperature' },
  { id: 'customer_caused', labelDe: 'Durch Kunde', labelEn: 'Customer caused' },
  { id: 'lost', labelDe: 'Vom Kunde verloren', labelEn: 'Lost by customer' },
  { id: 'other', labelDe: 'Sonstiges', labelEn: 'Other' },
];

export default function DamageReportDialog({ open, onClose, visitRef, customerName }: Props) {
  const { lang } = useLanguage();
  const { addReport } = useDamageReports();
  const [itemType, setItemType] = useState<DamageItemType | null>(null);
  const [itemLabel, setItemLabel] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [value, setValue] = useState('');
  const [cause, setCause] = useState<DamageCause | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setItemType(null); setItemLabel(''); setQuantity('1');
    setValue(''); setCause(null); setDescription('');
  };

  const handleSubmit = async () => {
    if (!itemType || !cause || !itemLabel.trim()) {
      toast.error(lang === 'de' ? 'Bitte alle Pflichtfelder ausfüllen' : 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      // Try grab GPS (best-effort)
      const coords = await locationService.getCurrentLocation({ timeout: 3000 });

      await addReport({
        item_type: itemType,
        item_label: itemLabel.trim(),
        quantity: Math.max(1, parseInt(quantity) || 1),
        estimated_value_eur: value ? parseFloat(value) : null,
        cause,
        description: description.trim(),
        visit_ref: visitRef ?? null,
        customer_name: customerName ?? null,
        gps_lat: coords?.latitude ?? null,
        gps_lng: coords?.longitude ?? null,
      });
      toast.success(lang === 'de' ? '✅ Schaden gemeldet' : '✅ Damage reported');
      reset();
      onClose();
    } catch (e) {
      toast.error(lang === 'de' ? 'Fehler beim Senden' : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
          >
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    {lang === 'de' ? 'Schaden / Verlust melden' : 'Report damage / loss'}
                  </h2>
                  {customerName && (
                    <p className="text-[11px] text-muted-foreground">{customerName}</p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Item type */}
              <div>
                <Label className="text-xs font-semibold mb-2 block">
                  {lang === 'de' ? 'Was ist beschädigt?' : 'What is damaged?'} *
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {ITEM_TYPES.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => {
                        setItemType(it.id);
                        if (!itemLabel) setItemLabel(lang === 'de' ? it.labelDe : it.labelEn);
                      }}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition ${
                        itemType === it.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <span className="text-xl">{it.emojiDe}</span>
                      <span className="text-[10px] font-medium leading-tight">
                        {lang === 'de' ? it.labelDe : it.labelEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Label + qty + value */}
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs font-semibold mb-1 block">
                    {lang === 'de' ? 'Bezeichnung' : 'Label'} *
                  </Label>
                  <Input
                    value={itemLabel}
                    onChange={(e) => setItemLabel(e.target.value)}
                    placeholder={lang === 'de' ? 'z.B. 60L Fass blau' : 'e.g. 60L blue barrel'}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    {lang === 'de' ? 'Menge' : 'Quantity'}
                  </Label>
                  <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    {lang === 'de' ? 'Geschätzter Wert (€)' : 'Est. value (€)'}
                  </Label>
                  <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              {/* Cause */}
              <div>
                <Label className="text-xs font-semibold mb-2 block">
                  {lang === 'de' ? 'Ursache' : 'Cause'} *
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {CAUSES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCause(c.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        cause === c.id
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                    >
                      {lang === 'de' ? c.labelDe : c.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-semibold mb-1 block">
                  {lang === 'de' ? 'Beschreibung' : 'Description'}
                </Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang === 'de' ? 'Was ist passiert?' : 'What happened?'}
                  className="w-full min-h-[70px] rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <Button variant="outline" size="sm" className="w-full" disabled>
                <Camera className="w-4 h-4 mr-1.5" />
                {lang === 'de' ? 'Foto hinzufügen (bald)' : 'Add photo (soon)'}
              </Button>
            </div>

            <div className="px-4 pb-4 pt-2 border-t shrink-0">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !itemType || !cause || !itemLabel.trim()}
                className="w-full h-12 text-base font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-2xl"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {lang === 'de' ? 'Schaden melden' : 'Report damage'}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
