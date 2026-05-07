import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, MapPin, Phone, Mail, Building2, ChevronRight, ChevronLeft,
  FileSignature, QrCode, CheckCircle2, Printer, Clock, Calendar, DoorOpen
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import ContainerScanner, { ScannedContainer, OtherContainer } from '@/components/ContainerScanner';
import SignaturePad from '@/components/SignaturePad';
import OpeningHoursPicker, { OpeningHours, defaultOpeningHours, DAYS } from '@/components/OpeningHoursPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface NewCustomerData {
  businessName: string;
  contactPerson: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
  openingHours: OpeningHours;
  preferredPickupFrom: string;
  preferredPickupTo: string;
  closedOnHolidays: boolean;
  specialClosures: string;
  accessNotes: string;
}

const STEPS = ['info', 'hours', 'contract', 'containers', 'signature', 'receipt'] as const;
type Step = typeof STEPS[number];

const NewCustomer = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('info');
  const [customerData, setCustomerData] = useState<NewCustomerData>({
    businessName: '', contactPerson: '', address: '', phone: '', email: '', notes: '',
    openingHours: defaultOpeningHours,
    preferredPickupFrom: '10:00',
    preferredPickupTo: '14:00',
    closedOnHolidays: true,
    specialClosures: '',
    accessNotes: '',
  });
  const [scannedContainers, setScannedContainers] = useState<ScannedContainer[]>([]);
  const [otherContainers, setOtherContainers] = useState<OtherContainer[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const customerNumber = 'K-' + Date.now().toString(36).toUpperCase().slice(-6);
  const now = new Date();
  const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const stepIndex = STEPS.indexOf(step);
  const canNext = () => {
    if (step === 'info') return customerData.businessName && customerData.contactPerson && customerData.address && customerData.phone;
    if (step === 'hours') return true;
    if (step === 'contract') return true;
    if (step === 'containers') return true;
    if (step === 'signature') return !!signature;
    return true;
  };

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handlePrintReceipt = () => {
    const printWin = window.open('', '_blank', 'width=400,height=600');
    if (!printWin) return;
    printWin.document.write(`
      <html><head><title>Neukunde Beleg</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;font-size:12px;max-width:380px;margin:0 auto}
        .header{text-align:center;border-bottom:2px solid #2d6a4f;padding-bottom:12px;margin-bottom:12px}
        .header h1{font-size:16px;color:#2d6a4f;margin:0}
        .row{display:flex;justify-content:space-between;padding:4px 0}
        .row.bold{font-weight:bold}
        .divider{border-top:1px dashed #ccc;margin:8px 0}
        .sig{margin-top:16px;text-align:center}
        .sig img{max-width:200px;height:60px}
        .footer{text-align:center;margin-top:20px;font-size:9px;color:#999}
        .highlight{background:#f0fdf4;padding:12px;border-radius:8px;text-align:center;margin:12px 0}
        .highlight .num{font-size:20px;font-weight:bold;color:#2d6a4f}
      </style></head><body>
        <div class="header">
          <h1>♻️ Beyond Collection</h1>
          <p style="color:#666;font-size:10px">Recycle Solution GmbH</p>
          <p style="font-size:11px;margin-top:8px;font-weight:bold">NEUKUNDENVERTRAG</p>
        </div>
        <div class="highlight">
          <p style="font-size:10px;color:#666">Ihre Kundennummer</p>
          <p class="num">${customerNumber}</p>
        </div>
        <div class="row"><span>Datum:</span><span>${dateStr}</span></div>
        <div class="divider"></div>
        <div class="row bold"><span>Betrieb:</span><span>${customerData.businessName}</span></div>
        <div class="row"><span>Kontakt:</span><span>${customerData.contactPerson}</span></div>
        <div class="row"><span>Adresse:</span><span>${customerData.address}</span></div>
        <div class="row"><span>Telefon:</span><span>${customerData.phone}</span></div>
        ${customerData.email ? `<div class="row"><span>E-Mail:</span><span>${customerData.email}</span></div>` : ''}
        <div class="divider"></div>
        <p style="font-weight:bold;margin-bottom:4px">Öffnungszeiten:</p>
        ${DAYS.map((day) => {
          const dayLabels: Record<string, string> = { mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So' };
          const h = customerData.openingHours[day];
          return `<div class="row"><span>${dayLabels[day]}</span><span>${h.open ? `${h.from} – ${h.to}` : 'Geschlossen'}</span></div>`;
        }).join('')}
        <div class="row"><span>Beste Abholzeit:</span><span>${customerData.preferredPickupFrom} – ${customerData.preferredPickupTo}</span></div>
        ${customerData.closedOnHolidays ? `<div class="row"><span>Feiertage:</span><span>Geschlossen</span></div>` : ''}
        ${customerData.specialClosures ? `<div style="font-size:10px;margin-top:4px"><b>Sonderzeiten:</b> ${customerData.specialClosures}</div>` : ''}
        ${customerData.accessNotes ? `<div style="font-size:10px;margin-top:4px"><b>Zugang:</b> ${customerData.accessNotes}</div>` : ''}
        <div class="divider"></div>
        ${scannedContainers.length > 0 ? `
          <p style="font-weight:bold;margin-bottom:4px">Behälter:</p>
          ${scannedContainers.map(c => `<div class="row"><span>${c.id}</span><span>${c.type}</span></div>`).join('')}
          <div class="divider"></div>
        ` : ''}
        ${signature ? `<div class="sig"><p style="font-size:10px;color:#666">Kundenunterschrift:</p><img src="${signature}"/></div>` : ''}
        <div class="footer">
          <p>Bitte bewahren Sie diesen Beleg auf.</p>
          <p>Beyond Collection · Recycle Solution GmbH</p>
          <p>Heinrichswinkel 14, 38448 Wolfsburg</p>
        </div>
      </body></html>
    `);
    printWin.document.close();
    setTimeout(() => printWin.print(), 300);
  };

  const handleSave = () => {
    // Save to localStorage
    const stored = JSON.parse(localStorage.getItem('new_customers') || '[]');
    stored.push({
      ...customerData,
      customerNumber,
      scannedContainers,
      signature,
      createdAt: now.toISOString(),
    });
    localStorage.setItem('new_customers', JSON.stringify(stored));
    navigate(-1);
  };

  return (
    <AppLayout>
      <AppHeader title={t('newCust.title')} showBack />

      {/* Step indicator */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          {STEPS.map((s, i) => {
            const labels = [t('newCust.info'), t('newCust.hours'), t('newCust.contract'), t('newCust.containers'), t('newCust.signature'), t('newCust.receipt')];
            const active = i <= stepIndex;
            const current = i === stepIndex;
            return (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                } ${current ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-background' : ''}`}>
                  {i + 1}
                </div>
                <span className={`text-[9px] font-medium hidden sm:inline ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {labels[i]}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${active ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-2 pb-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Customer Info */}
          {step === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {t('newCust.businessName')}</label>
                  <Input value={customerData.businessName} onChange={e => setCustomerData(d => ({ ...d, businessName: e.target.value }))} placeholder="z.B. Restaurant Bella" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="w-3.5 h-3.5" /> {t('newCust.contact')}</label>
                  <Input value={customerData.contactPerson} onChange={e => setCustomerData(d => ({ ...d, contactPerson: e.target.value }))} placeholder="Vor- und Nachname" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {t('newCust.address')}</label>
                  <Input value={customerData.address} onChange={e => setCustomerData(d => ({ ...d, address: e.target.value }))} placeholder="Straße, PLZ, Ort" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {t('newCust.phone')}</label>
                  <Input type="tel" value={customerData.phone} onChange={e => setCustomerData(d => ({ ...d, phone: e.target.value }))} placeholder="+49 ..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {t('newCust.email')}</label>
                  <Input type="email" value={customerData.email} onChange={e => setCustomerData(d => ({ ...d, email: e.target.value }))} placeholder="email@beispiel.de" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('newCust.notes')}</label>
                  <textarea
                    value={customerData.notes}
                    onChange={e => setCustomerData(d => ({ ...d, notes: e.target.value }))}
                    placeholder={t('newCust.notesPlaceholder')}
                    className="w-full min-h-[60px] rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Opening Hours */}
          {step === 'hours' && (
            <motion.div key="hours" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{t('newCust.hours.title')}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{t('newCust.hours.subtitle')}</p>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-foreground mb-2">{t('newCust.hours.weekly')}</p>
                  <OpeningHoursPicker
                    value={customerData.openingHours}
                    onChange={(oh) => setCustomerData((d) => ({ ...d, openingHours: oh }))}
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-foreground mb-1">{t('newCust.hours.preferred')}</p>
                <p className="text-[10px] text-muted-foreground mb-2">{t('newCust.hours.preferredHint')}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t('newCust.hours.from')}</span>
                  <input
                    type="time"
                    value={customerData.preferredPickupFrom}
                    onChange={(e) => setCustomerData((d) => ({ ...d, preferredPickupFrom: e.target.value }))}
                    className="flex-1 h-9 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">{t('newCust.hours.to')}</span>
                  <input
                    type="time"
                    value={customerData.preferredPickupTo}
                    onChange={(e) => setCustomerData((d) => ({ ...d, preferredPickupTo: e.target.value }))}
                    className="flex-1 h-9 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerData.closedOnHolidays}
                    onChange={(e) => setCustomerData((d) => ({ ...d, closedOnHolidays: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-border accent-primary"
                  />
                  <span className="text-xs text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {t('newCust.hours.holidays')}
                  </span>
                </label>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('newCust.hours.specialClosures')}</label>
                  <textarea
                    value={customerData.specialClosures}
                    onChange={(e) => setCustomerData((d) => ({ ...d, specialClosures: e.target.value }))}
                    placeholder={t('newCust.hours.specialClosuresPh')}
                    className="w-full min-h-[50px] rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5" /> {t('newCust.hours.access')}
                </label>
                <textarea
                  value={customerData.accessNotes}
                  onChange={(e) => setCustomerData((d) => ({ ...d, accessNotes: e.target.value }))}
                  placeholder={t('newCust.hours.accessPh')}
                  className="w-full min-h-[50px] rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Contract */}
          {step === 'contract' && (
            <motion.div key="contract" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="text-center mb-4">
                  <FileSignature className="w-10 h-10 text-primary mx-auto mb-2" />
                  <h3 className="font-bold text-foreground text-lg">{t('newCust.contractTitle')}</h3>
                  <p className="text-xs text-muted-foreground">{t('newCust.contractSub')}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground space-y-2 leading-relaxed">
                  <p className="font-bold">Vertrag über die Sammlung und Entsorgung von Altöl und Speisefett</p>
                  <p>Zwischen:</p>
                  <p className="font-semibold text-primary">Recycle Solution GmbH</p>
                  <p>Heinrichswinkel 14, 38448 Wolfsburg</p>
                  <p className="mt-2">und</p>
                  <p className="font-semibold text-primary">{customerData.businessName || '—'}</p>
                  <p>{customerData.address || '—'}</p>
                  <p>Ansprechpartner: {customerData.contactPerson || '—'}</p>
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="font-bold">§1 Gegenstand</p>
                    <p>Der Auftragnehmer verpflichtet sich zur regelmäßigen Abholung und fachgerechten Entsorgung von Altöl und Speisefett aus dem Betrieb des Auftraggebers.</p>
                  </div>
                  <div className="border-t border-border pt-2">
                    <p className="font-bold">§2 Leistungen</p>
                    <p>Bereitstellung von Sammelbehältern, regelmäßige Abholung nach Bedarf, fachgerechte Entsorgung gemäß geltender Umweltvorschriften.</p>
                  </div>
                  <div className="border-t border-border pt-2">
                    <p className="font-bold">§3 Vergütung</p>
                    <p>Die Vergütung erfolgt gemäß der aktuellen Preisliste. Zahlung ausschließlich per Banküberweisung.</p>
                  </div>
                  <div className="border-t border-border pt-2">
                    <p className="font-bold">§4 Laufzeit</p>
                    <p>Der Vertrag wird auf unbestimmte Zeit geschlossen und kann mit einer Frist von 4 Wochen zum Monatsende gekündigt werden.</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 text-center">
                  {t('newCust.showContract')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Container Scan */}
          {step === 'containers' && (
            <motion.div key="containers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{t('newCust.containersTitle')}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {t('newCust.scanHint')}
                </p>
                <ContainerScanner
                  scannedContainers={scannedContainers}
                  onScan={c => setScannedContainers(prev => [...prev, c])}
                  onRemove={id => setScannedContainers(prev => prev.filter(c => c.id !== id))}
                  otherContainers={otherContainers}
                  onOtherContainersChange={setOtherContainers}
                />
              </div>
            </motion.div>
          )}

          {/* Step 4: Signature */}
          {step === 'signature' && (
            <motion.div key="signature" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-primary" />
                  {t('newCust.custSignature')}
                </h3>
                {signature ? (
                  <div className="text-center">
                    <img src={signature} alt="Unterschrift" className="h-20 mx-auto mb-2" />
                    <p className="text-xs text-primary font-semibold">✓ {t('newCust.signatureSaved')}</p>
                    <button onClick={() => setSignature(null)} className="text-[10px] text-muted-foreground underline mt-1">
                      {t('newCust.resignBtn')}
                    </button>
                  </div>
                ) : (
                  <SignaturePad onSave={(dataUrl) => setSignature(dataUrl)} />
                )}
              </div>
            </motion.div>
          )}

          {/* Step 5: Receipt */}
          {step === 'receipt' && (
            <motion.div key="receipt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3"
                >
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="text-lg font-bold text-foreground">{t('newCust.registered')}</h3>
                <div className="bg-primary/5 rounded-xl p-3 mt-3">
                  <p className="text-[10px] text-muted-foreground">{t('newCust.customerNo')}</p>
                  <p className="text-xl font-bold text-primary">{customerNumber}</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-left">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('newCust.business')}</span>
                    <span className="font-semibold text-foreground">{customerData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('newCust.contactLabel')}</span>
                    <span className="text-foreground">{customerData.contactPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('newCust.containersLabel')}</span>
                    <span className="text-foreground">{scannedContainers.length} {t('newCust.pieces')}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handlePrintReceipt} variant="outline" className="w-full h-11">
                <Printer className="w-4 h-4 mr-1.5" />
                {t('newCust.printReceipt')}
              </Button>

              <Button onClick={handleSave} className="w-full h-12 text-base font-semibold bg-gradient-brand hover:opacity-90">
                {t('newCust.saveFinish')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step !== 'receipt' && (
          <div className="flex gap-3 mt-6">
            {stepIndex > 0 && (
              <Button variant="outline" onClick={goBack} className="flex-1 h-11">
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('newCust.back')}
              </Button>
            )}
            <Button
              onClick={goNext}
              disabled={!canNext()}
              className="flex-1 h-11 bg-primary text-primary-foreground"
            >
              {t('newCust.next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default NewCustomer;
