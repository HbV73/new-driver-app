import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Landmark, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SignaturePad from '@/components/SignaturePad';
import { useLanguage } from '@/contexts/LanguageContext';

interface BankUpdateFormProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: BankUpdateData) => void;
  customerName: string;
  customerId: number;
}

export interface BankUpdateData {
  businessName: string;
  email: string;
  ownerName: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  city: string;
  date: string;
  signature: string;
}

const BankUpdateForm = ({ open, onClose, onComplete, customerName, customerId }: BankUpdateFormProps) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'form' | 'signature' | 'done'>('form');
  const [form, setForm] = useState({
    businessName: customerName,
    email: '',
    ownerName: '',
    bankName: '',
    accountHolder: '',
    iban: 'DE',
  });
  const [signature, setSignature] = useState<string | null>(null);

  const update = (key: keyof typeof form, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const isFormValid = form.businessName && form.ownerName && form.bankName && form.accountHolder && form.iban.length > 4;

  const handleSign = (dataUrl: string) => {
    setSignature(dataUrl);
    const now = new Date();
    onComplete({
      ...form,
      city: 'Hannover',
      date: now.toLocaleDateString('de-DE'),
      signature: dataUrl,
    });
    setStep('done');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background w-full max-w-lg rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{t('bank.title')}</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-4 pt-3 pb-1 shrink-0">
              <div className="inline-flex items-center gap-2 bg-primary/8 rounded-lg px-3 py-1.5">
                <span className="text-xs font-bold text-primary">{t('bank.customerNo')}: {customerId}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {step === 'form' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block font-medium">{t('bank.businessName')}</label>
                    <Input value={form.businessName} onChange={e => update('businessName', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block font-medium">{t('bank.email')}</label>
                    <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block font-medium">{t('bank.ownerName')}</label>
                    <Input value={form.ownerName} onChange={e => update('ownerName', e.target.value)} />
                  </div>

                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-foreground mb-2">{t('bank.bankDetails')}</h4>
                    <div className="space-y-3 bg-card rounded-xl border border-border p-3">
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block font-medium">{t('bank.institution')}</label>
                        <Input value={form.bankName} onChange={e => update('bankName', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block font-medium">{t('bank.accountHolder')}</label>
                        <Input value={form.accountHolder} onChange={e => update('accountHolder', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block font-medium">IBAN</label>
                        <Input
                          value={form.iban}
                          onChange={e => update('iban', e.target.value.toUpperCase())}
                          placeholder="DE00 0000 0000 0000 0000 00"
                          maxLength={27}
                          className="font-mono tracking-wider"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep('signature')}
                    disabled={!isFormValid}
                    className="w-full h-12 bg-primary text-primary-foreground mt-2"
                  >
                    {t('bank.toSignature')}
                  </Button>
                </motion.div>
              )}

              {step === 'signature' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                    <p><strong>{t('bank.businessName')}:</strong> {form.businessName}</p>
                    <p><strong>{t('bank.ownerName')}:</strong> {form.ownerName}</p>
                    <p><strong>IBAN:</strong> {form.iban}</p>
                  </div>
                  <SignaturePad onSave={handleSign} />
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{t('bank.updated')}</h3>
                  <p className="text-sm text-muted-foreground">{t('bank.updatedSub')}</p>
                  <Button onClick={onClose} className="mt-4 bg-primary text-primary-foreground">
                    {t('bank.close')}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BankUpdateForm;
