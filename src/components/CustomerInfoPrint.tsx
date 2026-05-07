import { useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { Visit } from '@/types';
import { customerContainerInventory } from '@/data/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  open: boolean;
  onClose: () => void;
  visit: Visit;
  /** Support center phone shown at the bottom of the printout */
  supportPhone?: string;
}

const CustomerInfoPrint = ({ open, onClose, visit, supportPhone = '+49 511 1234567' }: Props) => {
  const { lang } = useLanguage();
  const isDe = lang === 'de';
  const inventory = customerContainerInventory[visit.id] || [];

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handlePrint = () => window.print();
  const today = new Date().toLocaleDateString(isDe ? 'de-DE' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 print:p-0 print:bg-white">
      {/* Toolbar (hidden on print) */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow-lg hover:opacity-90"
        >
          <Printer className="w-4 h-4" />
          {isDe ? 'Drucken' : 'Print'}
        </button>
        <button
          onClick={onClose}
          className="bg-card text-foreground p-2 rounded-xl shadow-lg hover:bg-muted"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable receipt — sized for 80mm thermal printer roll */}
      <div
        className="bg-white text-black w-[80mm] max-h-[90vh] overflow-y-auto p-4 font-mono text-[12px] leading-tight shadow-2xl print:shadow-none print:max-h-none print:overflow-visible print:w-full"
        id="customer-info-printout"
      >
        {/* Header */}
        <div className="text-center border-b-2 border-black border-dashed pb-2 mb-2">
          <p className="text-[14px] font-bold uppercase tracking-wider">German Waste</p>
          <p className="text-[10px]">Management GmbH</p>
          <p className="text-[10px] mt-1">{isDe ? 'Kundeninformation' : 'Customer Information'}</p>
          <p className="text-[10px]">{today}</p>
        </div>

        {/* Customer ID */}
        <div className="mb-2">
          <p className="text-[10px] text-black/60">{isDe ? 'Kunden-Nr.' : 'Customer No.'}</p>
          <p className="text-[13px] font-bold">#{visit.id}</p>
        </div>

        {/* Customer name & address */}
        <div className="border-t border-black/30 pt-2 mb-2">
          <p className="text-[10px] text-black/60 uppercase font-bold">{isDe ? 'Firma' : 'Company'}</p>
          <p className="text-[13px] font-bold leading-tight">{visit.customerName}</p>

          <p className="text-[10px] text-black/60 uppercase font-bold mt-2">{isDe ? 'Ansprechpartner' : 'Contact'}</p>
          <p className="text-[12px]">{visit.contactPerson}</p>

          <p className="text-[10px] text-black/60 uppercase font-bold mt-2">{isDe ? 'Telefon' : 'Phone'}</p>
          <p className="text-[12px]">{visit.phone}</p>

          <p className="text-[10px] text-black/60 uppercase font-bold mt-2">{isDe ? 'Adresse' : 'Address'}</p>
          <p className="text-[12px] leading-tight">{visit.address}</p>
        </div>

        {/* Contract pricing */}
        <div className="border-t border-black/30 pt-2 mb-2">
          <p className="text-[10px] text-black/60 uppercase font-bold mb-1">
            {isDe ? 'Vertragskonditionen' : 'Contract Terms'}
          </p>
          <div className="flex justify-between text-[12px]">
            <span>{isDe ? 'Altölpreis' : 'Used oil price'}</span>
            <span className="font-bold">{visit.contractPrice},00 €/kg</span>
          </div>
          {visit.estimatedOilAmount > 0 && (
            <div className="flex justify-between text-[11px] text-black/70 mt-0.5">
              <span>{isDe ? 'Ø Menge / Besuch' : 'Avg. amount / visit'}</span>
              <span>{visit.estimatedOilAmount} kg</span>
            </div>
          )}
          {visit.minOilCollected > 0 && (
            <div className="flex justify-between text-[11px] text-black/70 mt-0.5">
              <span>{isDe ? 'Min. Abnahme' : 'Min. pickup'}</span>
              <span>{visit.minOilCollected} kg</span>
            </div>
          )}
        </div>

        {/* Containers list */}
        {inventory.length > 0 && (
          <div className="border-t border-black/30 pt-2 mb-2">
            <p className="text-[10px] text-black/60 uppercase font-bold mb-1">
              {isDe ? 'Behälter beim Kunden' : 'Containers at customer'} ({inventory.length})
            </p>
            {inventory.map((c) => (
              <div key={c.containerId} className="flex justify-between text-[11px]">
                <span className="font-mono">{c.containerId}</span>
                <span className="text-black/70">{c.type}</span>
              </div>
            ))}
          </div>
        )}

        {/* NOTE: bank account info intentionally NOT printed for security */}

        {/* Support footer */}
        <div className="border-t-2 border-black border-dashed pt-2 mt-3 text-center">
          <p className="text-[10px] text-black/60 uppercase font-bold">
            {isDe ? 'Servicecenter' : 'Support Center'}
          </p>
          <p className="text-[14px] font-bold tracking-wider mt-0.5">{supportPhone}</p>
          <p className="text-[9px] text-black/60 mt-1">
            {isDe ? 'Mo–Fr 07:00–18:00' : 'Mon–Fri 07:00–18:00'}
          </p>
          <p className="text-[9px] text-black/50 mt-2">
            {isDe
              ? 'Bei Fragen zu Vertrag, Rechnung oder Bankdaten kontaktieren Sie bitte unser Servicecenter.'
              : 'For questions about contract, invoice or bank details, please contact our support center.'}
          </p>
        </div>

        {/* Thermal feed gap */}
        <div className="h-6" />
      </div>

      {/* Print-only styles: hide everything else, show only the printout */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #customer-info-printout, #customer-info-printout * { visibility: visible !important; }
          #customer-info-printout {
            position: absolute !important;
            left: 0; top: 0;
            width: 80mm !important;
            box-shadow: none !important;
          }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default CustomerInfoPrint;
