-- =========================
-- Vehicles
-- =========================
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT NOT NULL UNIQUE,
  make TEXT,
  model TEXT,
  year INTEGER,
  capacity_kg INTEGER NOT NULL DEFAULT 3500,
  current_km INTEGER NOT NULL DEFAULT 0,
  next_tuv_date DATE,
  next_service_date DATE,
  next_oil_change_km INTEGER,
  winter_tires_until DATE,
  insurance_until DATE,
  assigned_driver_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicles"
  ON public.vehicles FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Pre-trip inspections
-- =========================
CREATE TABLE public.pre_trip_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id),
  log_date DATE NOT NULL,
  brakes_ok BOOLEAN NOT NULL DEFAULT false,
  tires_ok BOOLEAN NOT NULL DEFAULT false,
  lights_ok BOOLEAN NOT NULL DEFAULT false,
  oil_level_ok BOOLEAN NOT NULL DEFAULT false,
  adblue_ok BOOLEAN NOT NULL DEFAULT false,
  body_damage_ok BOOLEAN NOT NULL DEFAULT false,
  first_aid_kit_ok BOOLEAN NOT NULL DEFAULT false,
  fire_extinguisher_ok BOOLEAN NOT NULL DEFAULT false,
  reflective_vest_ok BOOLEAN NOT NULL DEFAULT false,
  warning_triangle_ok BOOLEAN NOT NULL DEFAULT false,
  start_km INTEGER,
  fuel_level_percent INTEGER,
  signature_data TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  defects_noted TEXT DEFAULT '',
  blocked_from_driving BOOLEAN NOT NULL DEFAULT false,
  synced_to_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE public.pre_trip_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inspections"
  ON public.pre_trip_inspections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inspections"
  ON public.pre_trip_inspections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inspections"
  ON public.pre_trip_inspections FOR UPDATE USING (auth.uid() = user_id);

-- =========================
-- Fatigue events
-- =========================
CREATE TABLE public.fatigue_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_log_id UUID,
  continuous_drive_minutes INTEGER NOT NULL,
  alert_shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  break_taken_at TIMESTAMPTZ,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  synced_to_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fatigue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fatigue events"
  ON public.fatigue_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fatigue events"
  ON public.fatigue_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fatigue events"
  ON public.fatigue_events FOR UPDATE USING (auth.uid() = user_id);

-- =========================
-- Vehicle service alerts
-- =========================
CREATE TYPE public.service_alert_type AS ENUM ('tuv', 'service', 'oil_change', 'tires', 'insurance', 'inspection_defect', 'other');
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');

CREATE TABLE public.vehicle_service_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  alert_type public.service_alert_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  due_km INTEGER,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  dismissed_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_service_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view service alerts"
  ON public.vehicle_service_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update service alerts"
  ON public.vehicle_service_alerts FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_vehicle_service_alerts_updated_at
  BEFORE UPDATE ON public.vehicle_service_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Incident reports
-- =========================
CREATE TYPE public.incident_type AS ENUM ('accident', 'breakdown', 'theft', 'vandalism', 'medical', 'fuel_issue', 'customer_dispute', 'other');

CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id),
  activity_log_id UUID,
  incident_type public.incident_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  description TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  voice_note_url TEXT,
  other_party_info JSONB DEFAULT '{}',
  police_report_number TEXT,
  injuries BOOLEAN NOT NULL DEFAULT false,
  vehicle_drivable BOOLEAN NOT NULL DEFAULT true,
  synced_to_admin BOOLEAN NOT NULL DEFAULT false,
  admin_acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own incidents"
  ON public.incident_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own incidents"
  ON public.incident_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incidents"
  ON public.incident_reports FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_incident_reports_updated_at
  BEFORE UPDATE ON public.incident_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Offline sync queue
-- =========================
CREATE TYPE public.sync_status AS ENUM ('pending', 'syncing', 'success', 'failed', 'abandoned');

CREATE TABLE public.sync_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  client_id TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  status public.sync_status NOT NULL DEFAULT 'pending',
  last_error TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync queue"
  ON public.sync_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync queue"
  ON public.sync_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync queue"
  ON public.sync_queue FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_sync_queue_pending ON public.sync_queue(user_id, status) WHERE status = 'pending';

-- =========================
-- Storage bucket for compliance media
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-media', 'compliance-media', false);

CREATE POLICY "Users can view own compliance media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'compliance-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own compliance media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'compliance-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own compliance media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'compliance-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own compliance media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'compliance-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================
-- Add new event types to platformSync
-- (handled in edge function code, no DB change needed)
-- =========================