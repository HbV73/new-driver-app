
-- Create stop_type enum
CREATE TYPE public.stop_type AS ENUM ('customer_visit', 'warehouse', 'home', 'break', 'suspicious', 'transit');

-- Add stop_type to driver_visit_logs
ALTER TABLE public.driver_visit_logs ADD COLUMN stop_type public.stop_type NOT NULL DEFAULT 'customer_visit';

-- Add anti-tampering fields to driver_activity_logs
ALTER TABLE public.driver_activity_logs ADD COLUMN daily_hash TEXT DEFAULT '';
ALTER TABLE public.driver_activity_logs ADD COLUMN edit_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.driver_activity_logs ADD COLUMN warehouse_minutes INTEGER DEFAULT 0;

-- Create audit log table
CREATE TABLE public.driver_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_log_id UUID REFERENCES public.driver_activity_logs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view own audit logs"
  ON public.driver_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
  ON public.driver_audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger function to auto-log changes and increment edit_count
CREATE OR REPLACE FUNCTION public.log_activity_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment edit count
  NEW.edit_count = OLD.edit_count + 1;
  NEW.updated_at = now();
  
  -- Log changed fields
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.driver_audit_logs (user_id, activity_log_id, field_name, old_value, new_value)
    VALUES (NEW.user_id, NEW.id, 'status', OLD.status::text, NEW.status::text);
  END IF;
  
  IF OLD.work_start IS DISTINCT FROM NEW.work_start THEN
    INSERT INTO public.driver_audit_logs (user_id, activity_log_id, field_name, old_value, new_value)
    VALUES (NEW.user_id, NEW.id, 'work_start', OLD.work_start::text, NEW.work_start::text);
  END IF;
  
  IF OLD.work_end IS DISTINCT FROM NEW.work_end THEN
    INSERT INTO public.driver_audit_logs (user_id, activity_log_id, field_name, old_value, new_value)
    VALUES (NEW.user_id, NEW.id, 'work_end', OLD.work_end::text, NEW.work_end::text);
  END IF;
  
  IF OLD.total_work_minutes IS DISTINCT FROM NEW.total_work_minutes THEN
    INSERT INTO public.driver_audit_logs (user_id, activity_log_id, field_name, old_value, new_value)
    VALUES (NEW.user_id, NEW.id, 'total_work_minutes', OLD.total_work_minutes::text, NEW.total_work_minutes::text);
  END IF;
  
  IF OLD.drive_minutes IS DISTINCT FROM NEW.drive_minutes THEN
    INSERT INTO public.driver_audit_logs (user_id, activity_log_id, field_name, old_value, new_value)
    VALUES (NEW.user_id, NEW.id, 'drive_minutes', OLD.drive_minutes::text, NEW.drive_minutes::text);
  END IF;
  
  IF OLD.break_minutes IS DISTINCT FROM NEW.break_minutes THEN
    INSERT INTO public.driver_audit_logs (user_id, activity_log_id, field_name, old_value, new_value)
    VALUES (NEW.user_id, NEW.id, 'break_minutes', OLD.break_minutes::text, NEW.break_minutes::text);
  END IF;
  
  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    INSERT INTO public.driver_audit_logs (user_id, activity_log_id, field_name, old_value, new_value)
    VALUES (NEW.user_id, NEW.id, 'notes', OLD.notes, NEW.notes);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER track_activity_changes
  BEFORE UPDATE ON public.driver_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity_changes();
