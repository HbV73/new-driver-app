
-- Create day status enum
CREATE TYPE public.day_status AS ENUM ('worked', 'sick', 'vacation', 'rest_day', 'training');

-- Create operation type enum
CREATE TYPE public.operation_type AS ENUM ('collection', 'delivery', 'inspection');

-- Create driver activity logs table
CREATE TABLE public.driver_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL,
  status public.day_status NOT NULL DEFAULT 'worked',
  work_start TIMESTAMPTZ,
  work_end TIMESTAMPTZ,
  total_work_minutes INTEGER DEFAULT 0,
  drive_minutes INTEGER DEFAULT 0,
  break_minutes INTEGER DEFAULT 0,
  start_km INTEGER,
  end_km INTEGER,
  driven_km INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Create driver visit logs table
CREATE TABLE public.driver_visit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_log_id UUID NOT NULL REFERENCES public.driver_activity_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  operation_type public.operation_type NOT NULL DEFAULT 'collection',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_visit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_activity_logs
CREATE POLICY "Users can view own activity logs"
ON public.driver_activity_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
ON public.driver_activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity logs"
ON public.driver_activity_logs FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for driver_visit_logs
CREATE POLICY "Users can view own visit logs"
ON public.driver_visit_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visit logs"
ON public.driver_visit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visit logs"
ON public.driver_visit_logs FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_driver_activity_logs_updated_at
BEFORE UPDATE ON public.driver_activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
