import { motion } from 'framer-motion';
import { Sparkles, Route, Clock, Fuel, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouteOptimizer, OptimizerVisit, OptimizationResult } from '@/hooks/useRouteOptimizer';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  visits: OptimizerVisit[];
  onApply?: (order: (string | number)[], result: OptimizationResult) => void;
  startLat?: number;
  startLng?: number;
}

export function SmartRouteCard({ visits, onApply, startLat, startLng }: Props) {
  const { t } = useLanguage();
  const { optimize, loading, result } = useRouteOptimizer();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">{t('smartRoute.title')}</h3>
          <p className="text-[10px] text-muted-foreground">{t('smartRoute.subtitle')}</p>
        </div>
      </div>

      {!result && (
        <Button
          size="sm"
          disabled={loading || visits.length === 0}
          onClick={() => void optimize(visits, { startLat, startLng })}
          className="w-full bg-primary hover:bg-primary/90 rounded-xl h-10"
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('smartRoute.optimizing')}</> : <><Sparkles className="w-4 h-4 mr-2" />{t('smartRoute.optimize')}</>}
        </Button>
      )}

      {result && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card/60 rounded-xl p-2 text-center">
              <Route className="w-3.5 h-3.5 mx-auto mb-0.5 text-primary" />
              <p className="text-[9px] text-muted-foreground">km</p>
              <p className="text-xs font-bold">{result.estimated_total_km?.toFixed(0) ?? '–'}</p>
            </div>
            <div className="bg-card/60 rounded-xl p-2 text-center">
              <Clock className="w-3.5 h-3.5 mx-auto mb-0.5 text-secondary" />
              <p className="text-[9px] text-muted-foreground">min</p>
              <p className="text-xs font-bold">{result.estimated_total_minutes ?? '–'}</p>
            </div>
            <div className="bg-card/60 rounded-xl p-2 text-center">
              <Fuel className="w-3.5 h-3.5 mx-auto mb-0.5 text-warning" />
              <p className="text-[9px] text-muted-foreground">€ Spar.</p>
              <p className="text-xs font-bold">{result.estimated_fuel_savings_eur?.toFixed(1) ?? '–'}</p>
            </div>
          </div>
          {result.reasoning && (
            <p className="text-[11px] text-muted-foreground italic px-1 leading-relaxed">"{result.reasoning}"</p>
          )}
          <Button
            size="sm"
            onClick={() => onApply?.(result.order, result)}
            className="w-full bg-gradient-brand hover:opacity-90 rounded-xl h-10"
          >
            <Check className="w-4 h-4 mr-2" />{t('smartRoute.apply')}
          </Button>
        </>
      )}
    </motion.div>
  );
}
