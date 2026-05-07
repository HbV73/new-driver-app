import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Droplets, Package, ChevronRight, ArrowUpFromLine, ArrowDownToLine, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Visit } from '@/types';
import SignaturePad from '@/components/SignaturePad';
import ReceiptPreview from '@/components/ReceiptPreview';
import { ScannedContainer, OtherContainer } from '@/components/ContainerScanner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductEntry {
  name: string;
  qty: number;
  price: number;
}

interface VisitSummaryProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  visit: Visit;
  netWeight: number;
  products: ProductEntry[];
  scannedContainers: ScannedContainer[];
  otherContainers?: OtherContainer[];
  containers: { label: string; count: number }[];
}

const VisitSummary = ({
  open, onClose, onComplete, visit, netWeight, products, scannedContainers, otherContainers = [], containers,
}: VisitSummaryProps) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'summary' | 'signature' | 'receipt' | 'feedback'>('summary');
  const [signature, setSignature] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const activeProducts = products.filter(p => p.qty > 0);
  const pickupContainers = scannedContainers.filter(c => c.direction === 'pickup');
  const dropoffContainers = scannedContainers.filter(c => c.direction === 'dropoff');

  const handleSign = (dataUrl: string) => {
    setSignature(dataUrl);
    setStep('receipt');
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
            className="bg-background w-full max-w-lg rounded-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl"
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-border shrink-0">
              <h2 className="text-lg font-bold text-foreground">
                {step === 'summary' && t('summary.title')}
                {step === 'signature' && t('summary.signature')}
                {step === 'receipt' && t('summary.receipts')}
                {step === 'feedback' && t('summary.feedbackMedia')}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {step === 'summary' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="bg-primary/5 rounded-xl p-3">
                    <p className="text-sm font-bold text-foreground">{visit.customerName}</p>
                    <p className="text-xs text-muted-foreground">{visit.address}</p>
                  </div>

                  {netWeight > 0 && (
                    <div className="bg-card rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">{t('summary.oilCollected')}</h4>
                      </div>
                      <p className="text-2xl font-bold text-primary">{netWeight} kg</p>
                    </div>
                  )}

                  {pickupContainers.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowUpFromLine className="w-4 h-4 text-amber-600" />
                        <h4 className="text-sm font-semibold text-foreground">{t('summary.pickedUp')}</h4>
                      </div>
                      <div className="space-y-1">
                        {pickupContainers.map(c => (
                          <div key={c.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{c.id}</span>
                            <span className="text-xs text-muted-foreground">{c.scannedAt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dropoffContainers.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowDownToLine className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">{t('summary.droppedOff')}</h4>
                      </div>
                      <div className="space-y-1">
                        {dropoffContainers.map(c => (
                          <div key={c.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{c.id}</span>
                            <span className="text-xs text-muted-foreground">{c.scannedAt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {otherContainers.filter(c => c.count > 0).length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <PackageOpen className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">{t('summary.otherContainers')}</h4>
                      </div>
                      <div className="space-y-1">
                        {otherContainers.filter(c => c.count > 0).map(c => (
                          <div key={c.label} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{c.label}</span>
                            <span className="font-semibold text-foreground">{c.count}×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeProducts.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">{t('summary.soldProducts')}</h4>
                      </div>
                      <div className="space-y-1">
                        {activeProducts.map(p => (
                          <div key={p.name} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{p.qty}× {p.name}</span>
                            <span className="font-semibold text-foreground">{(p.qty * p.price).toFixed(2)} €</span>
                          </div>
                        ))}
                        <div className="border-t border-border pt-1 flex justify-between font-bold text-sm">
                          <span className="text-foreground">{t('summary.total')}</span>
                          <span className="text-primary">
                            {activeProducts.reduce((s, p) => s + p.qty * p.price, 0).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={() => setStep('signature')} className="w-full h-12 bg-primary text-primary-foreground">
                    {t('summary.toSignature')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}

              {step === 'signature' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {signature ? (
                    <div className="bg-card rounded-xl border border-primary/30 p-4 text-center">
                      <img src={signature} alt="" className="h-20 mx-auto mb-2" />
                      <p className="text-xs text-primary font-semibold">✓ {t('summary.signatureSaved')}</p>
                      <button onClick={() => setSignature(null)} className="text-[10px] text-muted-foreground underline mt-1">
                        {t('summary.resignBtn')}
                      </button>
                    </div>
                  ) : (
                    <SignaturePad onSave={handleSign} />
                  )}
                  {signature && (
                    <Button onClick={() => setStep('receipt')} className="w-full h-12 bg-primary text-primary-foreground">
                      {t('summary.toReceipts')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </motion.div>
              )}

              {step === 'receipt' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="flex gap-2">
                    <ReceiptPreview visit={visit} type="pickup" netWeight={netWeight} signature={signature || undefined} />
                    <ReceiptPreview visit={visit} type="delivery" signature={signature || undefined} />
                  </div>
                  <Button onClick={() => setStep('feedback')} className="w-full h-12 bg-primary text-primary-foreground">
                    {t('summary.toFeedback')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}

              {step === 'feedback' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        📷 {t('summary.photoBtn')}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        🎤 {t('summary.voiceBtn')}
                      </Button>
                    </div>
                    <textarea
                      placeholder={t('summary.notePlaceholder')}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <Button
                    onClick={onComplete}
                    className="w-full h-12 text-base font-semibold bg-gradient-brand hover:opacity-90"
                  >
                    {t('summary.confirmBtn')}
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

export default VisitSummary;
