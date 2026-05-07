import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

interface VisitInput {
  id: string | number;
  customerName: string;
  address: string;
  lat?: number;
  lng?: number;
  estimatedOilKg?: number;
  scheduledTime?: string;
  priority?: 'low' | 'normal' | 'high';
}

interface Body {
  startLat?: number;
  startLng?: number;
  visits: VisitInput[];
  vehicleCapacityKg?: number;
  currentLoadKg?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const body = (await req.json()) as Body;
    if (!Array.isArray(body.visits) || body.visits.length === 0) {
      return new Response(JSON.stringify({ error: 'visits required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (body.visits.length > 60) {
      return new Response(JSON.stringify({ error: 'Too many visits (max 60)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are a logistics route optimizer for a German used-oil collection truck.
Start point: ${body.startLat ?? 'depot'}, ${body.startLng ?? 'depot'}
Vehicle capacity: ${body.vehicleCapacityKg ?? 3500} kg, current load: ${body.currentLoadKg ?? 0} kg.

Optimize the visit order to minimize total driving distance while:
- Respecting any scheduledTime windows (visits with explicit times must be near their slot).
- Prioritizing 'high' priority first when nearby.
- Avoiding exceeding vehicle capacity (sum of estimatedOilKg + currentLoad <= capacity).
- Grouping geographically close visits.

Visits (JSON):
${JSON.stringify(body.visits, null, 2)}

Return ONLY a JSON object (no markdown) of shape:
{
  "order": [<visit ids in optimal sequence>],
  "estimated_total_km": <number>,
  "estimated_total_minutes": <number>,
  "estimated_fuel_savings_eur": <number, vs naive order>,
  "reasoning": "<2-3 sentences in German>"
}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a precise route optimization engine. Always return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error('AI error', aiRes.status, txt);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: 'Rate limit. Try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: 'AI credits required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'AI failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiRes.json();
    const content: string = aiData.choices?.[0]?.message?.content ?? '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    // Persist
    const today = new Date().toISOString().slice(0, 10);
    const { data: saved } = await supabase
      .from('route_optimizations')
      .insert({
        user_id: user.id,
        log_date: today,
        input_visits: body.visits,
        optimized_order: parsed.order ?? [],
        estimated_total_km: parsed.estimated_total_km ?? null,
        estimated_total_minutes: parsed.estimated_total_minutes ?? null,
        estimated_fuel_savings_eur: parsed.estimated_fuel_savings_eur ?? null,
        reasoning: parsed.reasoning ?? '',
      })
      .select()
      .single();

    return new Response(JSON.stringify({ ...parsed, id: saved?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('optimize-route error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
