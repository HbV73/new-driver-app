import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

interface ContainerSelectorProps {
  label: string;
  emoji: string;
  initialCount?: number;
}

const ContainerSelector = ({ label, emoji, initialCount = 0 }: ContainerSelectorProps) => {
  const [count, setCount] = useState(initialCount);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl">{emoji}</span>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCount(Math.max(0, count - 1))}
          className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-sm font-bold w-6 text-center">{count}</span>
        <button
          onClick={() => setCount(count + 1)}
          className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ContainerSelector;
