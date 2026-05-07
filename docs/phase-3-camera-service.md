# Phase 3C Camera Service

## Device boundary

Camera access now goes through `src/services/device/camera.ts`.

The service returns an offline-ready photo object:

```ts
{
  uri?: string;
  path?: string;
  webPath?: string;
  format: string;
  capturedAt: string;
  source: 'native' | 'browser';
}
```

Native Android uses `@capacitor/camera`. Browser/Vite development uses a file-input fallback created inside the service, so UI components no longer own browser-only capture controls.

## Updated workflows

- Odometer/fuel compliance photos use the camera service, then keep the existing Supabase storage upload behavior.
- Misc expense receipt photos use the camera service, then keep the existing receipt upload behavior.

## Not changed in this phase

- GPS/location capture is still unchanged.
- Media offline queue is not implemented yet.
- Damage report and failed visit photo buttons remain UI-only because their current submit payloads do not support attached photo evidence yet.
