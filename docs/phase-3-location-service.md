# Phase 3D Foreground Location Service

## Device boundary

Foreground GPS access now goes through `src/services/device/location.ts`.

The service returns:

```ts
{
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  capturedAt: string;
  source: 'native' | 'browser';
}
```

Native Android uses `@capacitor/geolocation`. Browser/Vite development uses `navigator.geolocation` inside the service only.

## Updated workflows

- Odometer/fuel photo GPS metadata.
- Proof-of-collection GPS metadata in the Supabase Driver API adapter.
- Damage report best-effort GPS metadata.
- Backup request best-effort GPS metadata.
- Delivery signature best-effort GPS metadata.
- One-shot depot geofence start-location check.

## Not changed in this phase

- `useLiveLocation` still uses browser geolocation because it is a continuous tracking flow and belongs in the later live/background tracking phase.
- `useBreakMovementMonitor` still uses browser geolocation because it uses `watchPosition` and should be handled with the later tracking policy/battery work.
- No background location permissions were added.
