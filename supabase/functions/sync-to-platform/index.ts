import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncEvent {
  event_type: 'work_start' | 'work_end' | 'override' | 'km_deviation' | 'break_movement';
  driver_user_id: string;
  driver_name?: string;
  log_date: string;
  payload: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: SyncEvent = await req.json();
    if (!body.event_type || !body.log_date) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forward to admin platform webhook (env var set later by user)
    const adminWebhook = Deno.env.get('ADMIN_PLATFORM_WEBHOOK_URL');
    const adminSecret = Deno.env.get('ADMIN_PLATFORM_WEBHOOK_SECRET');

    if (!adminWebhook) {
      // Webhook not yet configured: log and return success so client doesn't break
      console.log('[sync-to-platform] ADMIN_PLATFORM_WEBHOOK_URL not set, event buffered:', body);
      return new Response(
        JSON.stringify({ status: 'buffered', message: 'Admin webhook not configured yet' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const enrichedPayload = {
      ...body,
      driver_user_id: user.id,
      source: 'driver-app',
      received_at: new Date().toISOString(),
    };

    const resp = await fetch(adminWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminSecret ? { 'X-Webhook-Secret': adminSecret } : {}),
      },
      body: JSON.stringify(enrichedPayload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('[sync-to-platform] admin webhook failed:', resp.status, text);
      return new Response(
        JSON.stringify({ status: 'failed', code: resp.status, error: text }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ status: 'forwarded' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[sync-to-platform] error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
