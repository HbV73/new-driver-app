-- 1) Depots table
CREATE TABLE IF NOT EXISTS public.depots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geofence_radius_m INTEGER NOT NULL DEFAULT 100,
  region TEXT DEFAULT 'Hannover',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.depots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view depots"
  ON public.depots FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_depots_updated_at
  BEFORE UPDATE ON public.depots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Extend driver_activity_logs with geofence/start-location fields
ALTER TABLE public.driver_activity_logs
  ADD COLUMN IF NOT EXISTS start_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_address TEXT,
  ADD COLUMN IF NOT EXISTS start_location_type TEXT
    CHECK (start_location_type IN ('depot','home_preloaded','override')),
  ADD COLUMN IF NOT EXISTS end_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_preloaded_for_next_day BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS depot_id UUID REFERENCES public.depots(id);

-- 3) Seed Hannover depot
INSERT INTO public.depots (name, address, latitude, longitude, geofence_radius_m, region)
VALUES ('Hauptlager Hannover', 'Industrieweg 12, 30179 Hannover', 52.4106, 9.7538, 100, 'Hannover')
ON CONFLICT DO NOTHING;