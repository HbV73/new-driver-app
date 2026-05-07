# راهنمای راه‌اندازی sync بین اپ راننده و پلتفرم ادمین

این فایل دستورالعمل کامل برای فعال کردن دریافت event های راننده در پلتفرم ادمین است.

## مرحله ۱: ساخت Edge Function در پروژه ادمین

به پروژه **Recycle Solution Platform** (`b4f5018a-0259-4ab1-952d-7f888acf8c28`) برید و این درخواست رو به Lovable بدید:

> «یک edge function به اسم `receive-driver-event` بساز که POST request دریافت کنه، secret هدر `X-Webhook-Secret` رو با env `DRIVER_APP_WEBHOOK_SECRET` چک کنه، و event رو در جدول `driver_alerts` ذخیره کنه. پایلود ورودی شامل `event_type` (`work_start` | `work_end` | `override` | `km_deviation` | `break_movement`)، `driver_user_id`، `log_date`، `payload` (jsonb) هست. severity برای `override` و `break_movement` بشه `high`، برای `km_deviation` بشه `medium`، برای بقیه `low`. عنوان alert از روی event_type ساخته بشه.»

یا کد آماده زیر رو در فایل `supabase/functions/receive-driver-event/index.ts` پروژه ادمین قرار بدید:

```typescript
import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const TYPE_TO_SEVERITY: Record<string, string> = {
  work_start: 'low',
  work_end: 'low',
  override: 'high',
  km_deviation: 'medium',
  break_movement: 'high',
};

const TYPE_TO_TITLE: Record<string, string> = {
  work_start: 'Fahrer hat Arbeit gestartet',
  work_end: 'Fahrer hat Arbeit beendet',
  override: '⚠️ Notfall-Start außerhalb des Lagers',
  km_deviation: 'Kilometer-Abweichung erkannt',
  break_movement: '🚨 Fahrzeugbewegung während Pflichtpause',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify shared secret
  const expectedSecret = Deno.env.get('DRIVER_APP_WEBHOOK_SECRET');
  const providedSecret = req.headers.get('X-Webhook-Secret');
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { event_type, driver_user_id, log_date, payload } = body;

    if (!event_type || !driver_user_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const severity = TYPE_TO_SEVERITY[event_type] ?? 'low';
    const title = TYPE_TO_TITLE[event_type] ?? event_type;
    const description = event_type === 'override'
      ? `Begründung: ${payload?.reason ?? '-'}`
      : event_type === 'km_deviation'
      ? `Abweichung: ${payload?.delta_km} km · Grund: ${payload?.reason ?? '-'}`
      : `Datum: ${log_date}`;

    const { error } = await supabase.from('driver_alerts').insert({
      driver_id: driver_user_id,
      alert_type: event_type,
      severity,
      action_mode: severity === 'high' ? 'action_required' : 'review',
      status: 'open',
      title,
      description,
      details: { log_date, ...payload },
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[receive-driver-event] error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

## مرحله ۲: secret در پروژه ادمین

در پلتفرم ادمین یک secret به اسم **`DRIVER_APP_WEBHOOK_SECRET`** اضافه کنید — یک رشته تصادفی طولانی (مثلاً ۴۰ کاراکتر).

## مرحله ۳: secrets در پروژه راننده

در همین پروژه راننده، دو secret اضافه کنید:

- **`ADMIN_PLATFORM_WEBHOOK_URL`** — URL کامل edge function ادمین
  مثال: `https://<ADMIN_PROJECT_REF>.supabase.co/functions/v1/receive-driver-event`
- **`ADMIN_PLATFORM_WEBHOOK_SECRET`** — همون مقدار `DRIVER_APP_WEBHOOK_SECRET` از پروژه ادمین

## مرحله ۴: تست

پس از تنظیم secret ها، در اپ راننده Start Work بزنید. در پنل ادمین جدول `driver_alerts` باید یک رکورد جدید با `alert_type='work_start'` داشته باشه.
