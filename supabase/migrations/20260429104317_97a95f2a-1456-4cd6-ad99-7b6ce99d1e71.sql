-- ============================================
-- #10 Digital Signatures for Fresh-Food Delivery
-- ============================================
CREATE TYPE public.signature_purpose AS ENUM ('fresh_food_delivery', 'oil_collection', 'bin_handover', 'damage_acknowledgement', 'other');

CREATE TABLE public.delivery_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_log_id UUID,
  visit_ref TEXT,
  customer_name TEXT NOT NULL,
  purpose signature_purpose NOT NULL DEFAULT 'fresh_food_delivery',
  signer_name TEXT NOT NULL,
  signer_role TEXT DEFAULT '',
  signature_data TEXT NOT NULL,
  items_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount_eur NUMERIC,
  notes TEXT DEFAULT '',
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_to_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers insert own signatures" ON public.delivery_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Drivers view own signatures" ON public.delivery_signatures
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers update own signatures" ON public.delivery_signatures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER trg_delivery_signatures_updated_at
  BEFORE UPDATE ON public.delivery_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_delivery_signatures_user_date ON public.delivery_signatures(user_id, signed_at DESC);
CREATE INDEX idx_delivery_signatures_visit ON public.delivery_signatures(visit_ref);

-- ============================================
-- #6 Backup Requests (driver asks for help)
-- ============================================
CREATE TYPE public.backup_request_kind AS ENUM ('extra_driver', 'vehicle_swap', 'fuel', 'tool_equipment', 'translator', 'medical', 'other');
CREATE TYPE public.backup_request_status AS ENUM ('open', 'acknowledged', 'dispatched', 'resolved', 'cancelled');
CREATE TYPE public.backup_urgency AS ENUM ('low', 'normal', 'high', 'critical');

CREATE TABLE public.backup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_log_id UUID,
  kind backup_request_kind NOT NULL,
  urgency backup_urgency NOT NULL DEFAULT 'normal',
  status backup_request_status NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  current_address TEXT,
  estimated_delay_minutes INTEGER,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  dispatched_helper UUID,
  resolved_at TIMESTAMPTZ,
  admin_note TEXT DEFAULT '',
  synced_to_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers insert own backup requests" ON public.backup_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Drivers view own backup requests" ON public.backup_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers update own open backup requests" ON public.backup_requests
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('open','acknowledged'));

CREATE TRIGGER trg_backup_requests_updated_at
  BEFORE UPDATE ON public.backup_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_backup_requests_user_status ON public.backup_requests(user_id, status, requested_at DESC);

-- ============================================
-- #2 Post-Trip / End-of-Shift Checklist
-- ============================================
CREATE TABLE public.post_trip_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_log_id UUID,
  vehicle_id UUID,
  log_date DATE NOT NULL,
  end_km INTEGER,
  fuel_level_percent INTEGER,
  adblue_refilled BOOLEAN NOT NULL DEFAULT false,
  vehicle_locked BOOLEAN NOT NULL DEFAULT false,
  fridge_off BOOLEAN NOT NULL DEFAULT false,
  cargo_area_clean BOOLEAN NOT NULL DEFAULT false,
  bins_returned BOOLEAN NOT NULL DEFAULT false,
  paperwork_submitted BOOLEAN NOT NULL DEFAULT false,
  keys_handed_over BOOLEAN NOT NULL DEFAULT false,
  damage_noticed BOOLEAN NOT NULL DEFAULT false,
  damage_description TEXT DEFAULT '',
  cash_handed_over BOOLEAN NOT NULL DEFAULT false,
  cash_amount_eur NUMERIC,
  notes TEXT DEFAULT '',
  signature_data TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_to_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_trip_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers insert own post-trip checklists" ON public.post_trip_checklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Drivers view own post-trip checklists" ON public.post_trip_checklists
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers update own post-trip checklists" ON public.post_trip_checklists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER trg_post_trip_checklists_updated_at
  BEFORE UPDATE ON public.post_trip_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_post_trip_user_date ON public.post_trip_checklists(user_id, log_date DESC);
CREATE UNIQUE INDEX uq_post_trip_user_date ON public.post_trip_checklists(user_id, log_date);
