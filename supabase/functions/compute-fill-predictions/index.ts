// Computes AI-based fill prediction for a customer's bin and stores it.
// Uses Lovable AI Gateway with structured tool-calling output.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Body {
  customer_ref: string;
  customer_name: string;
  container_type?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const body: Body = await req.json();
    if (!body.customer_ref || !body.customer_name) {
      return new Response(JSON.stringify({ error: 'customer_ref and customer_name required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const containerType = body.container_type ?? 'bin';

    // Pull last visits / POCs for this customer (visit_ref or customer_name match)
    const { data: pocs } = await supabase
      .from('proof_of_collection')
      .select('collected_at, net_weight_kg')
      .or(`visit_ref.eq.${body.customer_ref},customer_name.eq.${body.customer_name}`)
      .order('collected_at', { ascending: false })
      .limit(20);

    const samples = (pocs ?? []).map(p => ({
      date: (p.collected_at as string).split('T')[0],
      kg: Number(p.net_weight_kg),
    }));

    // Default heuristic if no samples
    let predictedFillPercent = 0;
    let avgKgPerDay: number | null = null;
    let predictedFullDate: string | null = null;
    let confidence = 0.3;
    let reasoning = 'No historical data — using neutral baseline.';
    const lastVisitDate = samples[0]?.date ?? null;

    if (samples.length >= 2) {
      // Simple kg/day from delta between first and last samples
      const sorted = [...samples].sort((a, b) => a.date.localeCompare(b.date));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const days = Math.max(1, (Date.parse(last.date) - Date.parse(first.date)) / 86400000);
      const totalKg = sorted.reduce((s, x) => s + x.kg, 0);
      avgKgPerDay = +(totalKg / days).toFixed(2);
    }

    // Ask Lovable AI for refined prediction
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (LOVABLE_API_KEY && samples.length > 0) {
      try {
        const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'You estimate when a used-cooking-oil collection bin will be full based on past pickups. Standard bin capacity is 60 kg. Today is ' + new Date().toISOString().split('T')[0] + '. Always use the suggest_prediction tool.' },
              { role: 'user', content: `Customer: ${body.customer_name}\nContainer: ${containerType}\nLast pickups (date, kg): ${JSON.stringify(samples)}\nEstimate current fill% and predicted-full date.` },
            ],
            tools: [{
              type: 'function', function: {
                name: 'suggest_prediction',
                description: 'Return predicted fill state.',
                parameters: {
                  type: 'object', additionalProperties: false,
                  properties: {
                    predicted_fill_percent: { type: 'integer', minimum: 0, maximum: 100 },
                    predicted_full_date: { type: 'string', description: 'YYYY-MM-DD or empty' },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    reasoning: { type: 'string' },
                  },
                  required: ['predicted_fill_percent', 'predicted_full_date', 'confidence', 'reasoning'],
                },
              },
            }],
            tool_choice: { type: 'function', function: { name: 'suggest_prediction' } },
          }),
        });
        if (aiResp.ok) {
          const j = await aiResp.json();
          const argsStr = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (argsStr) {
            const parsed = JSON.parse(argsStr);
            predictedFillPercent = Math.max(0, Math.min(100, parsed.predicted_fill_percent ?? 0));
            predictedFullDate = parsed.predicted_full_date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.predicted_full_date)
              ? parsed.predicted_full_date : null;
            confidence = Math.max(0, Math.min(1, parsed.confidence ?? 0.5));
            reasoning = String(parsed.reasoning ?? '').slice(0, 500);
          }
        } else {
          reasoning = `AI gateway error ${aiResp.status} — fallback heuristic used.`;
        }
      } catch (e) {
        reasoning = `AI call failed: ${e instanceof Error ? e.message : 'unknown'} — fallback heuristic.`;
      }
    }

    const { error: insErr } = await supabase.from('bin_fill_predictions').insert({
      customer_ref: body.customer_ref,
      container_type: containerType,
      predicted_fill_percent: predictedFillPercent,
      predicted_full_date: predictedFullDate,
      confidence,
      reasoning,
      last_visit_date: lastVisitDate,
      avg_kg_per_day: avgKgPerDay,
    });
    if (insErr) throw insErr;

    return new Response(JSON.stringify({
      ok: true,
      predicted_fill_percent: predictedFillPercent,
      predicted_full_date: predictedFullDate,
      confidence,
      avg_kg_per_day: avgKgPerDay,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[compute-fill-predictions] error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
