-- ============ LIVE GPS LOCATIONS ============
CREATE TABLE public.driver_live_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_log_id uuid,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  speed_kmh double precision,
  heading double precision,
  accuracy_m double precision,
  battery_percent integer,
  is_moving boolean NOT NULL DEFAULT false,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  synced_to_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_live_loc_user_time ON public.driver_live_locations(user_id, captured_at DESC);
ALTER TABLE public.driver_live_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own live locations" ON public.driver_live_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own live locations" ON public.driver_live_locations
  FOR SELECT USING (auth.uid() = user_id);

-- ============ DISPATCHED VISITS ============
CREATE TYPE public.dispatched_visit_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
CREATE TYPE public.dispatched_visit_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE public.dispatched_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id uuid NOT NULL,
  dispatched_by uuid,
  customer_name text NOT NULL,
  address text NOT NULL,
  lat double precision,
  lng double precision,
  contact_phone text,
  notes text DEFAULT '',
  priority public.dispatched_visit_priority NOT NULL DEFAULT 'normal',
  status public.dispatched_visit_status NOT NULL DEFAULT 'pending',
  estimated_oil_kg double precision,
  contract_price numeric,
  scheduled_at timestamp with time zone,
  responded_at timestamp with time zone,
  rejection_reason text,
  external_ref text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispatched_driver_status ON public.dispatched_visits(driver_user_id, status);
ALTER TABLE public.dispatched_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver views own dispatched visits" ON public.dispatched_visits
  FOR SELECT USING (auth.uid() = driver_user_id);
CREATE POLICY "Driver updates own dispatched visits" ON public.dispatched_visits
  FOR UPDATE USING (auth.uid() = driver_user_id);

CREATE TRIGGER trg_dispatched_visits_updated
  BEFORE UPDATE ON public.dispatched_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DAY LOCKS ============
CREATE TABLE public.day_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id uuid NOT NULL,
  log_date date NOT NULL,
  locked boolean NOT NULL DEFAULT true,
  locked_by uuid,
  reason text DEFAULT '',
  locked_at timestamp with time zone NOT NULL DEFAULT now(),
  unlocked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (driver_user_id, log_date)
);
ALTER TABLE public.day_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver views own day locks" ON public.day_locks
  FOR SELECT USING (auth.uid() = driver_user_id);

CREATE TRIGGER trg_day_locks_updated
  BEFORE UPDATE ON public.day_locks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATIONS INBOX ============
CREATE TYPE public.notification_kind AS ENUM (
  'dispatch', 'lock', 'unlock', 'message', 'alert', 'system', 'incident_ack'
);

CREATE TABLE public.driver_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.notification_kind NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text DEFAULT '',
  link text,
  payload jsonb DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user_unread ON public.driver_notifications(user_id, read, created_at DESC);
ALTER TABLE public.driver_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver views own notifications" ON public.driver_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Driver updates own notifications" ON public.driver_notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Driver inserts own notifications" ON public.driver_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ PUSH SUBSCRIPTIONS ============
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subs select" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own push subs insert" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own push subs delete" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ============ REALTIME ============
ALTER TABLE public.dispatched_visits REPLICA IDENTITY FULL;
ALTER TABLE public.day_locks REPLICA IDENTITY FULL;
ALTER TABLE public.driver_notifications REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatched_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.day_locks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_notifications;