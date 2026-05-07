import { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { WorkRules, getWorkRules, saveWorkRules, DEFAULT_WORK_RULES } from '@/data/fahrernachweisData';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
}

const WorkRulesSettings = ({ onBack }: Props) => {
  const { lang } = useLanguage();
  const [rules, setRules] = useState<WorkRules>(getWorkRules);

  const fields: { key: keyof WorkRules; label: { de: string; en: string }; unit: string; step: number }[] = [
    { key: 'maxDailyWorkMinutes', label: { de: 'Max. Arbeitszeit / Tag', en: 'Max daily work time' }, unit: 'min', step: 30 },
    { key: 'minBreakAfterMinutes', label: { de: 'Pflichtpause nach', en: 'Required break after' }, unit: 'min', step: 30 },
    { key: 'requiredBreakMinutes', label: { de: 'Mindestpause', en: 'Min break duration' }, unit: 'min', step: 5 },
    { key: 'maxDriveMinutes', label: { de: 'Max. Fahrzeit / Tag', en: 'Max drive time / day' }, unit: 'min', step: 30 },
    { key: 'geofenceRadiusMeters', label: { de: 'Geofence-Radius', en: 'Geofence radius' }, unit: 'm', step: 10 },
    { key: 'gpsJitterThresholdMeters', label: { de: 'GPS-Jitter Schwelle', en: 'GPS jitter threshold' }, unit: 'm', step: 5 },
  ];

  const handleSave = () => {
    saveWorkRules(rules);
    toast.success(lang === 'de' ? 'Regeln gespeichert' : 'Rules saved');
  };

  const handleReset = () => {
    setRules(DEFAULT_WORK_RULES);
    saveWorkRules(DEFAULT_WORK_RULES);
    toast.success(lang === 'de' ? 'Auf Standard zurückgesetzt' : 'Reset to defaults');
  };

  return (
    <AppLayout>
      <AppHeader title={lang === 'de' ? 'Arbeitsregeln' : 'Work Rules'} showBack onBack={onBack} />
      <div className="px-4 pt-4 pb-4 space-y-4">
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              {lang === 'de' ? 'Konfigurierbare Arbeitsregeln' : 'Configurable Work Rules'}
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'de'
              ? 'Diese Regeln bestimmen, wann Verstöße angezeigt werden. Anpassbar an Ihre betrieblichen Anforderungen.'
              : 'These rules determine when violations are flagged. Adjustable to your operational requirements.'}
          </p>

          {fields.map(({ key, label, unit, step }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-xs font-medium text-foreground flex-1">{label[lang]}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={rules[key]}
                  onChange={(e) => setRules(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  step={step}
                  min={0}
                  className="w-20 text-right text-sm font-mono bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-foreground"
                />
                <span className="text-[10px] text-muted-foreground w-6">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1 gap-2">
            <Save className="w-4 h-4" />
            {lang === 'de' ? 'Speichern' : 'Save'}
          </Button>
          <Button onClick={handleReset} variant="outline" className="gap-2">
            {lang === 'de' ? 'Standard' : 'Reset'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkRulesSettings;
