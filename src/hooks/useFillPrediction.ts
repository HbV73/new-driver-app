import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FillPrediction {
  customer_ref: string;
  container_type: string;
  predicted_fill_percent: number;
  predicted_full_date: string | null;
  confidence: number;
  reasoning: string;
  avg_kg_per_day: number | null;
  computed_at: string;
}

/**
 * Reads the latest cached AI fill prediction for a customer.
 * Predictions are written by the `compute-fill-predictions` edge function.
 */
export function useFillPrediction(customerRef: string | null | undefined) {
  const [prediction, setPrediction] = useState<FillPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerRef) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { data } = await supabase
        .from('bin_fill_predictions')
        .select('*')
        .eq('customer_ref', customerRef)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setPrediction((data as FillPrediction | null) ?? null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [customerRef]);

  return { prediction, loading };
}

/**
 * Trigger the AI computation for a single customer.
 */
export async function refreshFillPrediction(customerRef: string, customerName: string) {
  return supabase.functions.invoke('compute-fill-predictions', {
    body: { customer_ref: customerRef, customer_name: customerName },
  });
}
