import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Sparkles, Wrench, ParkingCircle, Receipt, Droplet, Coffee, Briefcase, Shield, Package, Upload, Check, X, Clock, ThumbsUp, ThumbsDown, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMiscExpenses } from '@/hooks/useMiscExpenses';
import { createMiscExpense, MiscCategory, MiscStatus } from '@/lib/miscExpenses';
import { toast } from 'sonner';
import { CapturedPhoto, cameraService, getCameraFailure } from '@/services/device/camera';

const MISC_CATEGORIES: { key: MiscCategory; icon: typeof Sparkles; color: string; bg: string }[] = [
  { key: 'cleaning', icon: Sparkles,      color: 'text-primary',         bg: 'bg-primary/10' },
  { key: 'tools',    icon: Wrench,        color: 'text-secondary',       bg: 'bg-secondary/10' },
  { key: 'parking',  icon: ParkingCircle, color: 'text-foreground',      bg: 'bg-muted' },
  { key: 'toll',     icon: Receipt,       color: 'text-warning',         bg: 'bg-warning/10' },
  { key: 'carwash',  icon: Droplet,       color: 'text-primary',         bg: 'bg-primary/10' },
  { key: 'food',     icon: Coffee,        color: 'text-warning',         bg: 'bg-warning/10' },
  { key: 'office',   icon: Briefcase,     color: 'text-secondary',       bg: 'bg-secondary/10' },
  { key: 'safety',   icon: Shield,        color: 'text-destructive',     bg: 'bg-destructive/10' },
  { key: 'other',    icon: Package,       color: 'text-muted-foreground',bg: 'bg-muted' },
];

const STATUS_META: Record<MiscStatus, { icon: typeof Clock; color: string; bg: string; tKey: string }> = {
  pending:    { icon: Clock,     color: 'text-warning',     bg: 'bg-warning/10',     tKey: 'expenses.statusPending' },
  approved:   { icon: ThumbsUp,  color: 'text-primary',     bg: 'bg-primary/10',     tKey: 'expenses.statusApproved' },
  rejected:   { icon: ThumbsDown,color: 'text-destructive', bg: 'bg-destructive/10', tKey: 'expenses.statusRejected' },
  reimbursed: { icon: Coins,     color: 'text-secondary',   bg: 'bg-secondary/10',   tKey: 'expenses.statusReimbursed' },
};

export function MiscExpensesTab({ onTotalChange }: { onTotalChange?: (total: number) => void }) {
  const { t } = useLanguage();
  const { items, refresh, userId } = useMiscExpenses();

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<MiscCategory>('cleaning');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'company_card'>('cash');
  const [receiptPhoto, setReceiptPhoto] = useState<CapturedPhoto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = items.reduce((s, e) => s + Number(e.amount || 0), 0);
  useEffect(() => { onTotalChange?.(total); }, [total, onTotalChange]);

  const handleSubmit = async () => {
    if (!userId) { toast.error('Not signed in'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Amount required'); return; }
    if (!description.trim()) { toast.error('Description required'); return; }

    setSubmitting(true);
    try {
      const receiptFile = receiptPhoto
        ? await cameraService.toFile(receiptPhoto, `misc-receipt-${Date.now()}`)
        : null;

      const res = await createMiscExpense({
        userId,
        category,
        description: description.trim(),
        amount: amt,
        vendor: vendor.trim(),
        paymentMethod,
        hasReceipt: !!receiptPhoto,
        receiptPhotoUrl: null,
        receiptFile,
      });

    if (res.queued) toast.success('Saved offline — will sync', { icon: '📡' });
    else toast.success(t('expenses.save'));

    setShowForm(false);
    setDescription(''); setAmount(''); setVendor(''); setReceiptPhoto(null); setCategory('cleaning');
      void refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Expense could not be saved');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiptCapture = async () => {
    try {
      const photo = await cameraService.capturePhoto({ filenamePrefix: 'misc-receipt' });
      setReceiptPhoto(photo);
    } catch (error) {
      const failure = getCameraFailure(error);
      if (failure.reason !== 'cancelled') {
        toast.error(failure.message);
      }
    }
  };

  const getCat = (key: string) => MISC_CATEGORIES.find(c => c.key === key) ?? MISC_CATEGORIES[MISC_CATEGORIES.length - 1];

  return (
    <motion.div
      key="misc"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-4"
    >
      <Button onClick={() => setShowForm(!showForm)} className="w-full bg-gradient-brand hover:opacity-90 rounded-xl h-11">
        <Plus className="w-4 h-4 mr-2" /> {t('expenses.newMiscExpense')}
      </Button>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card rounded-xl border border-border p-4 space-y-3 overflow-hidden">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{t('expenses.category')}</label>
              <div className="grid grid-cols-3 gap-1.5">
                {MISC_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = category === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all ${
                        isActive ? 'bg-primary/10 border border-primary/30 ring-1 ring-primary/20' : 'bg-muted/50 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : cat.color}`} />
                      <span className={`text-[9px] font-medium leading-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {t(`expenses.misc.${cat.key}` as never)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('expenses.description')}</label>
              <Input placeholder={t('expenses.miscDescPlaceholder')} value={description} onChange={e => setDescription(e.target.value)} maxLength={200} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('expenses.amount')}</label>
                <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('expenses.vendor')}</label>
                <Input placeholder="z.B. dm, REWE" value={vendor} onChange={e => setVendor(e.target.value)} maxLength={100} />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('expenses.paymentMethod')}</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['cash', 'card', 'company_card'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPaymentMethod(p)}
                    className={`py-2 rounded-lg text-[11px] font-medium transition-all ${
                      paymentMethod === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {p === 'cash' ? t('expenses.payCash') : p === 'card' ? t('expenses.payCard') : t('expenses.payCompanyCard')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReceiptCapture}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                receiptPhoto ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {receiptPhoto ? (
                <><Check className="w-4 h-4" /> <span className="text-xs font-medium truncate max-w-[200px]">Belegfoto aufgenommen</span></>
              ) : (
                <><Upload className="w-4 h-4" /> <span className="text-xs font-medium">{t('expenses.uploadReceipt')}</span></>
              )}
            </button>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)} disabled={submitting}>
                <X className="w-4 h-4 mr-1" /> {t('cancel')}
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-primary" disabled={submitting}>
                {submitting ? '…' : t('expenses.save')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-0.5">{t('expenses.recentMisc')}</h3>
        {items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border/40 p-6 text-center">
            <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t('expenses.noMiscExpenses')}</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30">
            {items.map((e) => {
              const cat = getCat(e.category);
              const Icon = cat.icon;
              const status = STATUS_META[e.status];
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.bg}`}>
                    <Icon className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12px] font-semibold text-foreground truncate">
                        {t(`expenses.misc.${e.category}` as never)}
                      </p>
                      <span className={`inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {t(status.tKey as never)}
                      </span>
                      {e.has_receipt && <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">📸</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {e.description}
                      {e.vendor && ` · ${e.vendor}`}
                      <span className="inline-flex items-center gap-0.5 ml-1"><Calendar className="w-2.5 h-2.5" />{e.expense_date}</span>
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{Number(e.amount).toFixed(2)} €</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
