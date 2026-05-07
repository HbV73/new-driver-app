-- Phase 5B/5C security hardening:
-- narrow broad authenticated read policies where the current driver app already queries scoped data.

DROP POLICY IF EXISTS "Drivers update own route stop completion fields"
  ON public.driver_route_stops;

CREATE POLICY "Drivers update own route stop completion fields"
  ON public.driver_route_stops
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_user_id)
  WITH CHECK (
    auth.uid() = driver_user_id
    AND status IN ('planned', 'en_route', 'arrived', 'in_progress', 'completed', 'skipped', 'cancelled')
  );

DROP POLICY IF EXISTS "Authenticated users can view vehicles"
  ON public.vehicles;

CREATE POLICY "Drivers view assigned vehicles"
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (assigned_driver_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can view service alerts"
  ON public.vehicle_service_alerts;

CREATE POLICY "Drivers view alerts for assigned vehicles"
  ON public.vehicle_service_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.vehicles v
      WHERE v.id = vehicle_service_alerts.vehicle_id
        AND v.assigned_driver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated view fill predictions"
  ON public.bin_fill_predictions;

CREATE POLICY "Drivers view predictions for assigned route customers"
  ON public.bin_fill_predictions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.driver_route_stops s
      WHERE s.driver_user_id = auth.uid()
        AND s.customer_ref = bin_fill_predictions.customer_ref
    )
  );

DROP POLICY IF EXISTS "Authenticated view quality scores"
  ON public.customer_quality_scores;

CREATE POLICY "Drivers view quality scores for assigned route customers"
  ON public.customer_quality_scores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.driver_route_stops s
      WHERE s.driver_user_id = auth.uid()
        AND s.customer_ref = customer_quality_scores.customer_ref
    )
  );

DROP POLICY IF EXISTS "Authenticated view upsell offers"
  ON public.bin_upsell_offers;

CREATE POLICY "Drivers view own or assigned-customer upsell offers"
  ON public.bin_upsell_offers
  FOR SELECT
  TO authenticated
  USING (
    suggested_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.driver_route_stops s
      WHERE s.driver_user_id = auth.uid()
        AND s.customer_ref = bin_upsell_offers.customer_ref
    )
  );
