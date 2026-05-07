import { Copy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayHours {
  open: boolean;
  from: string;
  to: string;
}

export type OpeningHours = Record<DayKey, DayHours>;

export const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const defaultOpeningHours: OpeningHours = {
  mon: { open: true, from: '08:00', to: '18:00' },
  tue: { open: true, from: '08:00', to: '18:00' },
  wed: { open: true, from: '08:00', to: '18:00' },
  thu: { open: true, from: '08:00', to: '18:00' },
  fri: { open: true, from: '08:00', to: '18:00' },
  sat: { open: false, from: '08:00', to: '14:00' },
  sun: { open: false, from: '08:00', to: '14:00' },
};

interface Props {
  value: OpeningHours;
  onChange: (next: OpeningHours) => void;
}

const OpeningHoursPicker = ({ value, onChange }: Props) => {
  const { t } = useLanguage();

  const update = (day: DayKey, patch: Partial<DayHours>) => {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  };

  const copyMonday = () => {
    const mon = value.mon;
    const next: OpeningHours = { ...value };
    DAYS.forEach((d) => {
      if (d !== 'mon') next[d] = { ...mon };
    });
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {DAYS.map((day) => (
        <div key={day} className="flex items-center gap-2">
          <label className="flex items-center gap-2 w-28 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={value[day].open}
              onChange={(e) => update(day, { open: e.target.checked })}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className={`text-xs font-medium ${value[day].open ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t(`newCust.hours.${day}`)}
            </span>
          </label>
          <input
            type="time"
            value={value[day].from}
            onChange={(e) => update(day, { from: e.target.value })}
            disabled={!value[day].open}
            className="flex-1 h-9 px-2 text-xs rounded-lg border border-border bg-background text-foreground disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="time"
            value={value[day].to}
            onChange={(e) => update(day, { to: e.target.value })}
            disabled={!value[day].open}
            className="flex-1 h-9 px-2 text-xs rounded-lg border border-border bg-background text-foreground disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={copyMonday}
        className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-primary font-medium hover:underline"
      >
        <Copy className="w-3 h-3" />
        {t('newCust.hours.copyMon')}
      </button>
    </div>
  );
};

export default OpeningHoursPicker;
