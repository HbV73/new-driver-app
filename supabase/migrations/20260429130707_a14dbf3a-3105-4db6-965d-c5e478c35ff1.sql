-- Add odometer & fuel photo fields to pre_trip_inspections
ALTER TABLE public.pre_trip_inspections
  ADD COLUMN IF NOT EXISTS odometer_photo_url text,
  ADD COLUMN IF NOT EXISTS fuel_gauge_photo_url text,
  ADD COLUMN IF NOT EXISTS odometer_photo_gps_lat double precision,
  ADD COLUMN IF NOT EXISTS odometer_photo_gps_lng double precision,
  ADD COLUMN IF NOT EXISTS odometer_photo_taken_at timestamptz;

-- Add odometer & fuel photo fields to post_trip_checklists
ALTER TABLE public.post_trip_checklists
  ADD COLUMN IF NOT EXISTS odometer_photo_url text,
  ADD COLUMN IF NOT EXISTS fuel_gauge_photo_url text,
  ADD COLUMN IF NOT EXISTS odometer_photo_gps_lat double precision,
  ADD COLUMN IF NOT EXISTS odometer_photo_gps_lng double precision,
  ADD COLUMN IF NOT EXISTS personal_km_deviation integer;

-- KM deviation alerts table
DO $$ BEGIN
  CREATE TYPE public.km_deviation_status AS ENUM ('pending', 'approved', 'flagged', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.km_deviation_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL,
  yesterday_end_km integer,
  today_start_km integer,
  deviation_km integer NOT NULL,
  threshold_km integer NOT NULL DEFAULT 30,
  status public.km_deviation_status NOT NULL DEFAULT 'pending',
  driver_explanation text DEFAULT '',
  admin_note text DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  synced_to_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.km_deviation_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own km deviation alerts"
  ON public.km_deviation_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers insert own km deviation alerts"
  ON public.km_deviation_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Drivers update own km deviation alerts"
  ON public.km_deviation_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_km_deviation_alerts_updated_at
  BEFORE UPDATE ON public.km_deviation_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies: allow drivers to upload odometer/fuel photos to compliance-media under their user folder
DO $$ BEGIN
  CREATE POLICY "Drivers upload own compliance media"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'compliance-media'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Drivers view own compliance media"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'compliance-media'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
