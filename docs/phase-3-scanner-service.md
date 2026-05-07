# Phase 3A/3B Scanner Service

## Device boundary

Scanner access now goes through `src/services/device/scanner.ts`.

The scanner service returns an offline-ready evidence object:

```ts
{
  code: string;
  format?: string;
  scannedAt: string;
  source: 'native' | 'browser' | 'manual';
}
```

UI components should not call the Capacitor scanner plugin directly. They should use the scanner service and decide how to present cancelled, denied, unavailable, or empty scan states.

## Native Android scanner

Android uses `@capacitor-mlkit/barcode-scanning`.

Configured Android requirements:

- `android.permission.CAMERA`
- `com.google.mlkit.vision.DEPENDENCIES=barcode_ui`

The current implementation uses the plugin's ready-to-use `scan()` interface. If the scanner is unavailable, cancelled, denied, or returns no readable code, the UI keeps a manual entry fallback.

## Browser/Vite fallback

Browser development does not use random simulated codes. The browser implementation reports scanner unavailability and lets the user enter the container code manually.

## Later offline-sync notes

Persist the returned scanner evidence with the visit proof payload. Do not reduce it to only a container string once offline sync is introduced, because `format`, `scannedAt`, and `source` are useful for audit and conflict handling.
