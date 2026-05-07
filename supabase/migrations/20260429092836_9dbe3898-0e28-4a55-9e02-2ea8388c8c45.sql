-- Enums
CREATE TYPE public.upsell_status AS ENUM ('suggested', 'accepted', 'declined', 'pending_admin');
CREATE TYPE public.upsell_type AS ENUM ('extra_bin', 'larger_container', 'extra_pickup', 'product_subscription');

-- proof_of_collection
CREATE TABLE public.proof_of_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_log_id UUID,
  visit_ref TEXT,
  customer_name TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  net_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 0,
  gross_weight_kg NUMERIC(8,2),
  tare_weight_kg NUMERIC(8,2),
  signature_data TEXT,
  signer_name TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  gps_accuracy_m DOUBLE PRECISION,
  containers_picked JSONB DEFAULT '[]'::jsonb,
  containers_dropped JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  synced_to_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proof_of_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own POC" ON public.proof_of_collection FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own POC" ON public.proof_of_collection FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own POC" ON public.proof_of_collection FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_poc_user_date ON public.proof_of_collection(user_id, collected_at DESC);

CREATE TRIGGER trg_poc_updated_at
BEFORE UPDATE ON public.proof_of_collection
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- bin_fill_predictions
CREATE TABLE public.bin_fill_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_ref TEXT NOT NULL,
  container_type TEXT NOT NULL DEFAULT 'bin',
  predicted_fill_percent INTEGER NOT NULL DEFAULT 0,
  predicted_full_date DATE,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  reasoning TEXT DEFAULT '',
  last_visit_date DATE,
  avg_kg_per_day NUMERIC(8,2),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bin_fill_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view fill predictions" ON public.bin_fill_predictions FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_fill_pred_customer ON public.bin_fill_predictions(customer_ref, computed_at DESC);

-- bin_upsell_offers
CREATE TABLE public.bin_upsell_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_ref TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  suggested_by UUID,
  upsell_type public.upsell_type NOT NULL,
  reason TEXT DEFAULT '',
  estimated_extra_kg_month NUMERIC(8,2),
  status public.upsell_status NOT NULL DEFAULT 'suggested',
  driver_note TEXT DEFAULT '',
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bin_upsell_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view upsell offers" ON public.bin_upsell_offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Driver insert upsell" ON public.bin_upsell_offers FOR INSERT WITH CHECK (auth.uid() = suggested_by);
CREATE POLICY "Driver update own upsell" ON public.bin_upsell_offers FOR UPDATE USING (auth.uid() = suggested_by);

CREATE INDEX idx_upsell_customer ON public.bin_upsell_offers(customer_ref, status);

CREATE TRIGGER trg_upsell_updated_at
BEFORE UPDATE ON public.bin_upsell_offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- customer_quality_scores
CREATE TABLE public.customer_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_ref TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 50,
  oil_quality_score INTEGER DEFAULT 50,
  access_score INTEGER DEFAULT 50,
  payment_score INTEGER DEFAULT 50,
  on_time_score INTEGER DEFAULT 50,
  total_visits INTEGER DEFAULT 0,
  total_oil_kg NUMERIC(10,2) DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view quality scores" ON public.customer_quality_scores FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_quality_customer ON public.customer_quality_scores(customer_ref);