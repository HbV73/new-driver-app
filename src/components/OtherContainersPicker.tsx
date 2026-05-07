import { useState } from 'react';
import { Plus, Minus, PlusCircle } from 'lucide-react';
import { OtherContainer } from '@/components/ContainerScanner';
import { useLanguage } from '@/contexts/LanguageContext';

const PRESET_OTHER_CONTAINERS = [
  'Kanister',
  'Eimer',
  'Fass',
  'IBC-Container',
];

interface OtherContainersPickerProps {
  otherContainers: OtherContainer[];
  onOtherContainersChange: (containers: OtherContainer[]) => void;
}

const OtherContainersPicker = ({ otherContainers, onOtherContainersChange }: OtherContainersPickerProps) => {
  const { t } = useLanguage();
  const [customName, setCustomName] = useState('');

  const allLabels = [
    ...PRESET_OTHER_CONTAINERS,
    ...otherContainers.filter(c => !PRESET_OTHER_CONTAINERS.includes(c.label)).map(c => c.label),
  ];

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    const existing = otherContainers.find(c => c.label === name);
    if (existing) {
      onOtherContainersChange(otherContainers.map(c => c.label === name ? { ...c, count: c.count + 1 } : c));
    } else {
      onOtherContainersChange([...otherContainers, { label: name, count: 1 }]);
    }
    setCustomName('');
  };

  return (
    <div className="space-y-2">
      {allLabels.map((label) => {
        const existing = otherContainers.find(c => c.label === label);
        const count = existing?.count || 0;
        return (
          <div key={label} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2.5">
            <span className="text-xs font-medium text-foreground">{label}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (count <= 0) return;
                  const updated = otherContainers
                    .map(c => c.label === label ? { ...c, count: c.count - 1 } : c)
                    .filter(c => c.count > 0);
                  onOtherContainersChange(updated);
                }}
                disabled={count <= 0}
                className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center disabled:opacity-30"
              >
                <Minus className="w-3.5 h-3.5 text-foreground" />
              </button>
              <span className="text-sm font-bold text-foreground w-6 text-center tabular-nums">{count}</span>
              <button
                onClick={() => {
                  if (existing) {
                    onOtherContainersChange(otherContainers.map(c => c.label === label ? { ...c, count: c.count + 1 } : c));
                  } else {
                    onOtherContainersChange([...otherContainers, { label, count: 1 }]);
                  }
                }}
                className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Custom container input */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder={t('otherPicker.placeholder')}
          className="flex-1 h-9 rounded-xl bg-muted/50 border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={addCustom}
          disabled={!customName.trim()}
          className="h-9 px-3 rounded-xl bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1 disabled:opacity-30 hover:bg-primary/15 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {t('otherPicker.add')}
        </button>
      </div>
    </div>
  );
};

export default OtherContainersPicker;
