import { motion } from 'framer-motion';
import { useState } from 'react';
import { Plus, TrendingUp, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  customerRef: string;
  customerName: string;
  /** Optional pre-filled suggestion based on AI fill prediction */
  suggestedReason?: string;
  estimatedExtraKgMonth?: number;
}

const TYPES: Array<{ key: 'extra_bin' | 'larger_container' | 'extra_pickup'; label: string }> = [
  { key: 'extra_bin', label: 'Extra Bin' },
  { key: 'larger_container', label: 'Larger Container' },
  { key: 'extra_pickup', label: 'Extra Pickup' },
];

export default function BinUpsellCard({ customerRef, customerName, suggestedReason, estimatedExtraKgMonth }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [type, setType] = useState<'extra_bin' | 'larger_container' | 'extra_pickup'>('extra_bin');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (status: 'suggested' | 'accepted' | 'declined') => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('bin_upsell_offers').insert({
      customer_ref: customerRef,
      customer_name: customerName,
      suggested_by: user.id,
      upsell_type: type,
      reason: suggestedReason ?? '',
      estimated_extra_kg_month: estimatedExtraKgMonth ?? null,
      status,
      driver_note: note,
      decided_at: status !== 'suggested' ? new Date().toISOString() : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t('upsell.failed'));
      return;
    }
    setSubmitted(true);
    toast.success(t('upsell.saved'));
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-2">
        <Check className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground">{t('upsell.thanks')}</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">{t('upsell.title')}</h4>
      </div>
      {suggestedReason && (
        <p className="text-xs text-muted-foreground italic">{suggestedReason}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map(opt => (
          <button
            key={opt.key}
            onClick={() => setType(opt.key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
              type === opt.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border'
            }`}
          >
            {t(`upsell.type.${opt.key}`)}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('upsell.notePh')}
        className="w-full min-h-[56px] rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
      />
      <div className="grid grid-cols-3 gap-1.5">
        <Button size="sm" variant="outline" disabled={submitting} onClick={() => submit('suggested')}>
          <Plus className="w-3.5 h-3.5 mr-1" /> {t('upsell.suggest')}
        </Button>
        <Button size="sm" disabled={submitting} onClick={() => submit('accepted')}
          className="bg-primary text-primary-foreground">
          <Check className="w-3.5 h-3.5 mr-1" /> {t('upsell.accepted')}
        </Button>
        <Button size="sm" variant="outline" disabled={submitting} onClick={() => submit('declined')}
          className="border-destructive/30 text-destructive">
          <X className="w-3.5 h-3.5 mr-1" /> {t('upsell.declined')}
        </Button>
      </div>
    </motion.div>
  );
}
