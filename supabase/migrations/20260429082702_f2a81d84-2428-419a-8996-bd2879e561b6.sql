DROP POLICY IF EXISTS "Authenticated users can update service alerts" ON public.vehicle_service_alerts;

CREATE POLICY "Assigned drivers can dismiss/resolve their vehicle alerts"
  ON public.vehicle_service_alerts FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_service_alerts.vehicle_id
        AND v.assigned_driver_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_service_alerts.vehicle_id
        AND v.assigned_driver_id = auth.uid()
    )
  );