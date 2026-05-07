import { supabase } from '@/integrations/supabase/client';

export type SyncEventType =
  | 'work_start'
  | 'work_end'
  | 'override'
  | 'km_deviation'
  | 'break_movement'
  | 'pre_trip_inspection'
  | 'fatigue_hard_limit'
  | 'live_location_batch'
  | 'dispatch_response'
  | 'incident_report'
  | 'misc_expense_added'
  | 'misc_expense_updated'
  | 'route_optimized'
  | 'delivery_signature'
  | 'backup_request'
  | 'backup_request_updated'
  | 'post_trip_checklist'
  | 'odometer_photo'
  | 'km_deviation_alert';

export async function sendPlatformEvent(
  eventType: SyncEventType,
  logDate: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.functions.invoke('sync-to-platform', {
      body: {
        event_type: eventType,
        driver_user_id: user.id,
        log_date: logDate,
        payload,
      },
    });
  } catch (e) {
    // Non-blocking: sync failure should not break driver flow
    console.warn('[platformSync] failed:', e);
  }
}
