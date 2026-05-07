import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OptimizerVisit {
  id: string | number;
  customerName: string;
  address: string;
  lat?: number;
  lng?: number;
  estimatedOilKg?: number;
  scheduledTime?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface OptimizationResult {
  id?: string;
  order: (string | number)[];
  estimated_total_km?: number;
  estimated_total_minutes?: number;
  estimated_fuel_savings_eur?: number;
  reasoning?: string;
}

export function useRouteOptimizer() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const optimize = async (visits: OptimizerVisit[], opts?: {
    startLat?: number; startLng?: number; vehicleCapacityKg?: number; currentLoadKg?: number;
  }) => {
    if (visits.length === 0) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: { visits, ...opts },
      });
      if (error || data?.error) {
        toast.error(data?.error ?? error?.message ?? 'Optimization failed');
        return null;
      }
      setResult(data as OptimizationResult);
      return data as OptimizationResult;
    } finally {
      setLoading(false);
    }
  };

  return { optimize, loading, result };
}
