-- Phase 5A security hotfix:
-- allow drivers to update only completion-related fields on their own route stops.

ALTER TABLE public.driver_route_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers update own route stop completion fields"
  ON public.driver_route_stops;

REVOKE UPDATE ON public.driver_route_stops FROM authenticated;

GRANT UPDATE (
  status,
  arrived_at,
  service_started_at,
  departed_at,
  completed_at,
  skipped_at,
  skip_reason,
  actual_duration_minutes,
  collected_oil_kg,
  proof_of_collection_id,
  containers_picked,
  containers_dropped,
  products_delivered,
  driver_notes
) ON public.driver_route_stops TO authenticated;

CREATE POLICY "Drivers update own route stop completion fields"
  ON public.driver_route_stops
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_user_id)
  WITH CHECK (auth.uid() = driver_user_id);
