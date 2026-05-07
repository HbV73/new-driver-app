import { Star } from 'lucide-react';
import { useCustomerQualityScore } from '@/hooks/useCustomerQualityScore';

interface Props { customerRef: string; }

function scoreColor(s: number) {
  if (s >= 80) return 'text-primary bg-primary/10 border-primary/30';
  if (s >= 60) return 'text-amber-600 bg-amber-100 border-amber-300';
  if (s >= 40) return 'text-orange-600 bg-orange-100 border-orange-300';
  return 'text-destructive bg-destructive/10 border-destructive/30';
}

export default function QualityScoreBadge({ customerRef }: Props) {
  const { score } = useCustomerQualityScore(customerRef);
  if (!score) return null;
  const cls = scoreColor(score.overall_score);
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      <Star className="w-3 h-3" />
      {score.overall_score}/100
    </div>
  );
}
