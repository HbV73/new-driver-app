-- =========================
-- Driver route source of truth
-- =========================

DO $$ BEGIN
  CREATE TYPE public.driver_route_status AS ENUM (
    'planned',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.driver_route_stop_status AS ENUM (
    'planned',
    'en_route',
    'arrived',
    'in_progress',
    'completed',
    'skipped',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.driver_route_visit_source AS ENUM (
    'scheduled',
    'called',
    'auto_planned',
    'prospect',
    'manual',
    'dispatch_addon'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.driver_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  depot_id uuid REFERENCES public.depots(id) ON DELETE SET NULL,
  dispatcher_user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  route_date date NOT NULL,
  route_code text NOT NULL,
  status public.driver_route_status NOT NULL DEFAULT 'planned',
  planned_start_at timestamptz,
  planned_end_at timestamptz,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  start_address text,
  start_lat double precision,
  start_lng double precision,
  end_address text,
  end_lat double precision,
  end_lng double precision,
  total_planned_stops integer NOT NULL DEFAULT 0,
  total_completed_stops integer NOT NULL DEFAULT 0,
  estimated_total_oil_kg numeric(10,2) NOT NULL DEFAULT 0,
  collected_total_oil_kg numeric(10,2) NOT NULL DEFAULT 0,
  estimated_total_km numeric(10,2),
  actual_total_km numeric(10,2),
  notes text DEFAULT '',
  admin_notes text DEFAULT '',
  synced_to_admin boolean NOT NULL DEFAULT false,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT driver_routes_route_code_not_blank CHECK (length(trim(route_code)) > 0),
  CONSTRAINT driver_routes_stop_counts_nonnegative CHECK (
    total_planned_stops >= 0
    AND total_completed_stops >= 0
    AND total_completed_stops <= total_planned_stops
  ),
  CONSTRAINT driver_routes_oil_totals_nonnegative CHECK (
    estimated_total_oil_kg >= 0
    AND collected_total_oil_kg >= 0
  ),
  UNIQUE(driver_user_id, route_date, route_code)
);

CREATE TABLE IF NOT EXISTS public.driver_route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.driver_routes(id) ON DELETE CASCADE,
  driver_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  activity_log_id uuid REFERENCES public.driver_activity_logs(id) ON DELETE SET NULL,
  proof_of_collection_id uuid REFERENCES public.proof_of_collection(id) ON DELETE SET NULL,
  dispatched_visit_id uuid REFERENCES public.dispatched_visits(id) ON DELETE SET NULL,
  external_ref text,
  customer_ref text,
  customer_name text NOT NULL,
  customer_tier text,
  contact_person text,
  contact_phone text,
  address text NOT NULL,
  lat double precision,
  lng double precision,
  stop_order integer NOT NULL,
  stop_type public.stop_type NOT NULL DEFAULT 'customer_visit',
  visit_source public.driver_route_visit_source NOT NULL DEFAULT 'scheduled',
  status public.driver_route_stop_status NOT NULL DEFAULT 'planned',
  priority public.dispatched_visit_priority NOT NULL DEFAULT 'normal',
  bank_update_required boolean NOT NULL DEFAULT false,
  planned_arrival_at timestamptz,
  planned_departure_at timestamptz,
  scheduled_time time,
  arrived_at timestamptz,
  service_started_at timestamptz,
  departed_at timestamptz,
  completed_at timestamptz,
  skipped_at timestamptz,
  skip_reason text,
  planned_duration_minutes integer,
  actual_duration_minutes integer,
  estimated_distance_km numeric(10,2),
  contract_price numeric(10,2),
  estimated_oil_kg numeric(10,2) NOT NULL DEFAULT 0,
  minimum_oil_kg numeric(10,2),
  collected_oil_kg numeric(10,2),
  containers_expected jsonb NOT NULL DEFAULT '[]'::jsonb,
  containers_picked jsonb NOT NULL DEFAULT '[]'::jsonb,
  containers_dropped jsonb NOT NULL DEFAULT '[]'::jsonb,
  products_expected jsonb NOT NULL DEFAULT '[]'::jsonb,
  products_delivered jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer_notes text DEFAULT '',
  driver_notes text DEFAULT '',
  admin_notes text DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_to_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT driver_route_stops_customer_name_not_blank CHECK (length(trim(customer_name)) > 0),
  CONSTRAINT driver_route_stops_address_not_blank CHECK (length(trim(address)) > 0),
  CONSTRAINT driver_route_stops_order_positive CHECK (stop_order > 0),
  CONSTRAINT driver_route_stops_duration_nonnegative CHECK (
    planned_duration_minutes IS NULL OR planned_duration_minutes >= 0
  ),
  CONSTRAINT driver_route_stops_actual_duration_nonnegative CHECK (
    actual_duration_minutes IS NULL OR actual_duration_minutes >= 0
  ),
  CONSTRAINT driver_route_stops_oil_nonnegative CHECK (
    estimated_oil_kg >= 0
    AND (minimum_oil_kg IS NULL OR minimum_oil_kg >= 0)
    AND (collected_oil_kg IS NULL OR collected_oil_kg >= 0)
  ),
  UNIQUE(route_id, stop_order)
);

ALTER TABLE public.driver_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own assigned routes"
  ON public.driver_routes FOR SELECT
  USING (auth.uid() = driver_user_id);

CREATE POLICY "Drivers view own assigned route stops"
  ON public.driver_route_stops FOR SELECT
  USING (auth.uid() = driver_user_id);

CREATE INDEX IF NOT EXISTS idx_driver_routes_driver_date
  ON public.driver_routes(driver_user_id, route_date DESC);

CREATE INDEX IF NOT EXISTS idx_driver_routes_status
  ON public.driver_routes(status);

CREATE INDEX IF NOT EXISTS idx_driver_route_stops_route_order
  ON public.driver_route_stops(route_id, stop_order);

CREATE INDEX IF NOT EXISTS idx_driver_route_stops_driver_status
  ON public.driver_route_stops(driver_user_id, status);

CREATE INDEX IF NOT EXISTS idx_driver_route_stops_external_ref
  ON public.driver_route_stops(external_ref)
  WHERE external_ref IS NOT NULL;

CREATE TRIGGER update_driver_routes_updated_at
  BEFORE UPDATE ON public.driver_routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_route_stops_updated_at
  BEFORE UPDATE ON public.driver_route_stops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
