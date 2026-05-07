import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Visit } from '@/types';

interface ReceiptPreviewProps {
  visit: Visit;
  type: 'pickup' | 'delivery';
  netWeight?: number;
  paymentAmount?: string;
  signature?: string;
}

const ReceiptPreview = ({ visit, type, netWeight = 0, paymentAmount, signature }: ReceiptPreviewProps) => {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const isPickup = type === 'pickup';

  const handlePrint = () => {
    // Create printable window
    const printWin = window.open('', '_blank', 'width=400,height=600');
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>${isPickup ? 'Pickup Receipt' : 'Delivery Receipt'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; max-width: 380px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #2d6a4f; padding-bottom: 12px; margin-bottom: 12px; }
            .header h1 { font-size: 16px; color: #2d6a4f; margin: 0; }
            .header p { color: #666; margin: 4px 0 0; font-size: 10px; }
            .row { display: flex; justify-content: space-between; padding: 4px 0; }
            .row.bold { font-weight: bold; }
            .divider { border-top: 1px dashed #ccc; margin: 8px 0; }
            .sig { margin-top: 16px; text-align: center; }
            .sig img { max-width: 200px; height: 60px; }
            .footer { text-align: center; margin-top: 20px; font-size: 9px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>♻️ Beyond Collection</h1>
            <p>Recycle Solution GmbH</p>
            <p style="font-size:11px; margin-top:8px; font-weight:bold;">${isPickup ? 'ABHOLBELEG' : 'LIEFERBELEG'}</p>
          </div>
          <div class="row"><span>Datum:</span><span>${dateStr}</span></div>
          <div class="row"><span>Uhrzeit:</span><span>${timeStr}</span></div>
          <div class="divider"></div>
          <div class="row bold"><span>Kunde:</span><span>${visit.customerName}</span></div>
          <div class="row"><span>Adresse:</span><span>${visit.address}</span></div>
          <div class="row"><span>Ansprechpartner:</span><span>${visit.contactPerson}</span></div>
          <div class="divider"></div>
          ${isPickup ? `
            <div class="row bold"><span>Altöl gesammelt:</span><span>${netWeight} kg</span></div>
            <div class="row"><span>Vertragspreis:</span><span>${visit.contractPrice},00 €</span></div>
            ${paymentAmount ? `<div class="row"><span>Zahlung:</span><span>${paymentAmount} €</span></div>` : ''}
          ` : `
            <div class="row bold"><span>Ware geliefert</span><span>✓</span></div>
          `}
          <div class="divider"></div>
          ${signature ? `
            <div class="sig">
              <p style="font-size:10px; color:#666;">Unterschrift Kunde:</p>
              <img src="${signature}" />
            </div>
          ` : ''}
          <div class="footer">
            <p>Beleg-Nr: ${visit.id}-${Date.now().toString(36).toUpperCase()}</p>
            <p>Beyond Collection · Recycle Solution GmbH</p>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    setTimeout(() => printWin.print(), 300);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex-1"
      >
        <Printer className="w-4 h-4 mr-1" />
        {isPickup ? 'Abholbeleg' : 'Lieferbeleg'}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border w-full max-w-sm overflow-hidden"
            >
              {/* Header */}
              <div className="bg-primary/10 p-4 text-center relative">
                <button onClick={() => setOpen(false)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                <FileText className="w-8 h-8 text-primary mx-auto mb-1" />
                <h3 className="font-bold text-foreground">{isPickup ? 'Abholbeleg' : 'Lieferbeleg'}</h3>
                <p className="text-xs text-muted-foreground">Vorschau</p>
              </div>

              {/* Receipt content */}
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Datum</span>
                  <span className="font-medium text-foreground">{dateStr} · {timeStr}</span>
                </div>
                <div className="border-t border-dashed border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kunde</span>
                  <span className="font-semibold text-foreground text-right max-w-[60%] truncate">{visit.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adresse</span>
                  <span className="text-foreground text-right max-w-[60%] text-xs">{visit.address}</span>
                </div>
                <div className="border-t border-dashed border-border" />
                {isPickup ? (
                  <>
                    <div className="flex justify-between font-bold">
                      <span className="text-foreground">Altöl</span>
                      <span className="text-primary">{netWeight} kg</span>
                    </div>
                    {paymentAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Zahlung</span>
                        <span className="text-foreground">{paymentAmount} €</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between font-bold">
                    <span className="text-foreground">Ware geliefert</span>
                    <span className="text-primary">✓</span>
                  </div>
                )}
                {signature && (
                  <>
                    <div className="border-t border-dashed border-border" />
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Kundenunterschrift</p>
                      <img src={signature} alt="Unterschrift" className="h-12 mx-auto" />
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 pt-0">
                <Button onClick={handlePrint} className="w-full bg-primary text-primary-foreground">
                  <Printer className="w-4 h-4 mr-1.5" />
                  Drucken / Teilen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReceiptPreview;
