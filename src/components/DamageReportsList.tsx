import { useState } from 'react';
import { Plus, AlertTriangle, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDamageReports, type DamageStatus } from '@/hooks/useDamageReports';
import DamageReportDialog from './DamageReportDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

const STATUS_META: Record<DamageStatus, { de: string; en: string; icon: typeof Clock; color: string }> = {
  reported: { de: 'Gemeldet', en: 'Reported', icon: Clock, color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  reviewed: { de: 'Geprüft', en: 'Reviewed', icon: RefreshCw, color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  replaced: { de: 'Ersetzt', en: 'Replaced', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  written_off: { de: 'Abgeschrieben', en: 'Written off', icon: XCircle, color: 'bg-muted text-muted-foreground border-border' },
  rejected: { de: 'Abgelehnt', en: 'Rejected', icon: XCircle, color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export default function DamageReportsList() {
  const { lang } = useLanguage();
  const { items, loading } = useDamageReports();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold">
            {lang === 'de' ? 'Schadensmeldungen' : 'Damage reports'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {lang === 'de' ? 'Defekte Behälter, verdorbene Ware usw.' : 'Broken bins, spoiled goods etc.'}
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="w-4 h-4 mr-1" />
          {lang === 'de' ? 'Melden' : 'Report'}
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground py-4 text-center">…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-xl">
          <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground mt-2">
            {lang === 'de' ? 'Keine Meldungen' : 'No reports yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => {
            const meta = STATUS_META[r.status];
            const Icon = meta.icon;
            return (
              <div key={r.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {r.item_label} <span className="text-muted-foreground font-normal">×{r.quantity}</span>
                    </p>
                    {r.customer_name && (
                      <p className="text-[11px] text-muted-foreground truncate">{r.customer_name}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`${meta.color} text-[10px] shrink-0 gap-1`}>
                    <Icon className="w-3 h-3" />
                    {lang === 'de' ? meta.de : meta.en}
                  </Badge>
                </div>
                {r.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                )}
                <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                  <span>{format(new Date(r.occurred_at), 'dd.MM.yyyy HH:mm')}</span>
                  {r.estimated_value_eur != null && (
                    <span className="font-semibold text-foreground">€ {Number(r.estimated_value_eur).toFixed(2)}</span>
                  )}
                </div>
                {r.admin_note && (
                  <div className="mt-2 p-2 rounded-lg bg-muted text-[11px]">
                    <span className="font-semibold">{lang === 'de' ? 'Admin: ' : 'Admin: '}</span>
                    {r.admin_note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DamageReportDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
