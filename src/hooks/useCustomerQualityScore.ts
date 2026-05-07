import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QualityScore {
  customer_ref: string;
  customer_name: string;
  overall_score: number;
  oil_quality_score: number;
  access_score: number;
  payment_score: number;
  on_time_score: number;
  total_visits: number;
  total_oil_kg: number;
  last_updated: string;
}

export function useCustomerQualityScore(customerRef: string | null | undefined) {
  const [score, setScore] = useState<QualityScore | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerRef) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { data } = await supabase
        .from('customer_quality_scores')
        .select('*')
        .eq('customer_ref', customerRef)
        .maybeSingle();
      if (!cancelled) {
        setScore((data as QualityScore | null) ?? null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [customerRef]);

  return { score, loading };
}
