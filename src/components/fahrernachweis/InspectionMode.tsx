import { Shield, X, FileDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { DayLog } from '@/data/fahrernachweisData';

interface Props {
  logs: DayLog[];
  onClose: () => void;
}

const statusLabel: Record<string, string> = {
  worked: 'Gearbeitet',
  sick: 'Krank',
  vacation: 'Urlaub',
  rest_day: 'Ruhetag',
  training: 'Schulung',
};

const statusIcon: Record<string, string> = {
  worked: '●',
  sick: '○',
  vacation: '◐',
  rest_day: '—',
  training: '◑',
};

const formatMin = (min: number) => {
  if (min === 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const InspectionMode = ({ logs, onClose }: Props) => {
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const now = new Date();
  const today = logs[0];

  const handlePrint = () => window.print();

  // Count stats
  const workedDays = logs.filter(l => l.status === 'worked').length;
  const totalDriveMin = logs.reduce((s, l) => s + l.driveMinutes, 0);
  const totalWorkMin = logs.reduce((s, l) => s + l.totalWorkMinutes, 0);
  const totalKm = logs.reduce((s, l) => s + l.drivenKm, 0);

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-black overflow-y-auto print:static">
      {/* Minimal top bar */}
      <div className="sticky top-0 z-50 bg-black text-white print:bg-black print:text-white">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-bold text-base tracking-tight">FAHRERNACHWEIS</span>
          </div>
          <div className="flex items-center gap-1 print:hidden">
            <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-white/20" aria-label="PDF/Print">
              <FileDown className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 text-[13px]">
        {/* Driver info - compact */}
        <div className="border-b border-black/20 pb-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Unternehmen / Company</p>
              <p className="text-sm font-bold">German Waste Management GmbH</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Erstellt / Generated</p>
              <p className="text-sm font-semibold">{now.toLocaleDateString('de-DE')} {now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <div className="mt-2 flex gap-6">
            <div>
              <span className="text-[10px] text-black/50 uppercase font-bold">Fahrer</span>
              <p className="font-bold">{profile?.full_name || 'Fahrer'}</p>
            </div>
            <div>
              <span className="text-[10px] text-black/50 uppercase font-bold">Zeitraum</span>
              <p className="font-bold">{logs[logs.length-1]?.date} — {logs[0]?.date}</p>
            </div>
          </div>
        </div>

        {/* Quick summary bar */}
        <div className="grid grid-cols-4 gap-2 text-center border border-black/10 rounded-lg p-2">
          <div>
            <p className="text-lg font-black">{workedDays}</p>
            <p className="text-[9px] text-black/50 font-bold uppercase">Arbeitstage</p>
          </div>
          <div>
            <p className="text-lg font-black">{formatMin(totalWorkMin)}</p>
            <p className="text-[9px] text-black/50 font-bold uppercase">Arbeitszeit</p>
          </div>
          <div>
            <p className="text-lg font-black">{formatMin(totalDriveMin)}</p>
            <p className="text-[9px] text-black/50 font-bold uppercase">Fahrzeit</p>
          </div>
          <div>
            <p className="text-lg font-black">{totalKm.toLocaleString()}</p>
            <p className="text-[9px] text-black/50 font-bold uppercase">km</p>
          </div>
        </div>

        {/* Today highlight if worked */}
        {today.status === 'worked' && (
          <div className="border border-black/20 rounded-lg p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">
              HEUTE — {new Date(today.date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <div className="flex gap-6 text-sm">
              <span><strong>Start:</strong> {today.workStart}</span>
              <span><strong>Ende:</strong> {today.workEnd}</span>
              <span><strong>Arbeit:</strong> {formatMin(today.totalWorkMinutes)}</span>
              <span><strong>Pause:</strong> {formatMin(today.breakMinutes)}</span>
              <span><strong>Fahrt:</strong> {formatMin(today.driveMinutes)}</span>
              <span><strong>km:</strong> {today.drivenKm}</span>
            </div>
            {today.visits.length > 0 && (
              <p className="text-[11px] mt-1 text-black/60">
                {today.visits.filter(v => v.stopType === 'customer_visit').length} Kunden · {today.visits.filter(v => v.stopType === 'warehouse').length} Lager · {today.visits.filter(v => v.stopType === 'break').length} Pause
              </p>
            )}
          </div>
        )}

        {/* 28 Days Table - ultra clean */}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-black text-[9px] font-bold uppercase text-black/50">
              <th className="text-left py-1.5 pr-2">Datum</th>
              <th className="text-left py-1.5">Status</th>
              <th className="text-center py-1.5">Start</th>
              <th className="text-center py-1.5">Ende</th>
              <th className="text-center py-1.5">Arbeit</th>
              <th className="text-center py-1.5">Pause</th>
              <th className="text-center py-1.5">Fahrt</th>
              <th className="text-center py-1.5">km</th>
              <th className="text-center py-1.5">Stops</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const d = new Date(log.date + 'T00:00:00');
              const isToday = log.date === today.date;
              return (
                <tr key={log.date} className={`border-b border-black/10 ${isToday ? 'bg-black/5 font-semibold' : ''}`}>
                  <td className="py-1 pr-2 font-medium">
                    {d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </td>
                  <td className="py-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-[10px]">{statusIcon[log.status]}</span>
                      {statusLabel[log.status]}
                    </span>
                  </td>
                  <td className="py-1 text-center font-mono">{log.workStart || '—'}</td>
                  <td className="py-1 text-center font-mono">{log.workEnd || '—'}</td>
                  <td className="py-1 text-center font-mono">{formatMin(log.totalWorkMinutes)}</td>
                  <td className="py-1 text-center font-mono">{formatMin(log.breakMinutes)}</td>
                  <td className="py-1 text-center font-mono">{formatMin(log.driveMinutes)}</td>
                  <td className="py-1 text-center font-mono">{log.drivenKm || '—'}</td>
                  <td className="py-1 text-center">{log.visits.filter(v => v.stopType === 'customer_visit').length || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Hash verification */}
        <div className="border-t border-black/20 pt-2 text-[9px] text-black/40 space-y-1">
          <p>Arbeitszeitnachweis gemäß § 21a ArbZG / VO (EG) 561/2006</p>
          <p>Zur Vorlage bei behördlichen Kontrollen · Alle Zeiten in Stunden:Minuten</p>
          {logs[0]?.dailyHash && (
            <p className="font-mono">Prüfsumme heute: {logs[0].dailyHash} · Änderungen: {logs[0].editCount || 0}</p>
          )}
          <p>© German Waste Management GmbH · {now.getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default InspectionMode;
