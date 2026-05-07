-- ============================================================
-- 1. work_settings : global settings managed by admin platform
-- ============================================================
CREATE TABLE public.work_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'global', -- 'global' | future: 'depot' | 'driver'
  scope_ref UUID, -- depot_id or user_id when scope != global
  break_duration_minutes INTEGER NOT NULL DEFAULT 60,
  break_movement_threshold_m INTEGER NOT NULL DEFAULT 100,
  break_movement_window_seconds INTEGER NOT NULL DEFAULT 120,
  geofence_radius_m INTEGER NOT NULL DEFAULT 100,
  max_daily_work_minutes INTEGER NOT NULL DEFAULT 540,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scope, scope_ref)
);

ALTER TABLE public.work_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated drivers can read settings
CREATE POLICY "Authenticated users can view work settings"
ON public.work_settings FOR SELECT
TO authenticated
USING (true);

-- Note: writes happen from admin platform via service role; no insert/update RLS for drivers.

CREATE TRIGGER update_work_settings_updated_at
BEFORE UPDATE ON public.work_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default global row
INSERT INTO public.work_settings (scope, break_duration_minutes, break_movement_threshold_m, break_movement_window_seconds, geofence_radius_m)
VALUES ('global', 60, 100, 120, 100);

-- ============================================================
-- 2. break_movement_alerts : audit of vehicle movement during break
-- ============================================================
CREATE TABLE public.break_movement_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_log_id UUID,
  break_start_at TIMESTAMPTZ NOT NULL,
  break_start_lat DOUBLE PRECISION NOT NULL,
  break_start_lng DOUBLE PRECISION NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  detected_lat DOUBLE PRECISION NOT NULL,
  detected_lng DOUBLE PRECISION NOT NULL,
  distance_m INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  driver_reason TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  synced_to_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.break_movement_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own break movement alerts"
ON public.break_movement_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own break movement alerts"
ON public.break_movement_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own break movement alerts"
ON public.break_movement_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE INDEX idx_break_alerts_user_date ON public.break_movement_alerts(user_id, detected_at DESC);
