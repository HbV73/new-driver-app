-- Damage reports table for broken bins/barrels and damaged fresh goods
CREATE TYPE public.damage_item_type AS ENUM ('bin', 'barrel_60', 'barrel_30', 'fresh_food', 'product', 'other');
CREATE TYPE public.damage_cause AS ENUM ('drop', 'collision', 'wear', 'spoiled', 'temperature', 'customer_caused', 'unknown', 'other');
CREATE TYPE public.damage_status AS ENUM ('reported', 'reviewed', 'replaced', 'written_off', 'rejected');

CREATE TABLE public.damage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_log_id uuid,
  visit_ref text,
  customer_name text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  item_type public.damage_item_type NOT NULL,
  item_label text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  estimated_value_eur numeric(10,2),
  cause public.damage_cause NOT NULL DEFAULT 'unknown',
  description text NOT NULL DEFAULT '',
  photo_urls text[] DEFAULT '{}',
  voice_note_url text,
  gps_lat double precision,
  gps_lng double precision,
  status public.damage_status NOT NULL DEFAULT 'reported',
  admin_note text DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  synced_to_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers insert own damage reports"
ON public.damage_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Drivers view own damage reports"
ON public.damage_reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Drivers update own pending damage reports"
ON public.damage_reports FOR UPDATE
USING (auth.uid() = user_id AND status = 'reported');

CREATE TRIGGER update_damage_reports_updated_at
BEFORE UPDATE ON public.damage_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_damage_reports_user_date ON public.damage_reports(user_id, occurred_at DESC);
CREATE INDEX idx_damage_reports_status ON public.damage_reports(status) WHERE status = 'reported';