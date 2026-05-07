import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type LocationSource = 'native' | 'browser';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  capturedAt: string;
  source: LocationSource;
}

export type LocationFailureReason =
  | 'permission-denied'
  | 'unavailable'
  | 'timeout'
  | 'unknown';

export interface LocationFailure {
  reason: LocationFailureReason;
  message: string;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface LocationService {
  getCurrentLocation(options?: LocationOptions): Promise<DeviceLocation | null>;
}

const toDeviceLocation = (
  coords: GeolocationCoordinates,
  timestamp: number,
  source: LocationSource,
): DeviceLocation => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  accuracy: coords.accuracy ?? null,
  altitude: coords.altitude ?? null,
  speed: coords.speed ?? null,
  heading: coords.heading ?? null,
  capturedAt: new Date(timestamp || Date.now()).toISOString(),
  source,
});

const toLocationFailure = (error: unknown): LocationFailure => {
  const candidate = error as { code?: number | string; message?: string };
  const code = String(candidate?.code ?? '').toLowerCase();
  const message = String(candidate?.message ?? error ?? '').toLowerCase();

  if (code === '1' || message.includes('permission') || message.includes('denied')) {
    return {
      reason: 'permission-denied',
      message: 'Standortzugriff wurde abgelehnt.',
    };
  }

  if (code === '3' || message.includes('timeout')) {
    return {
      reason: 'timeout',
      message: 'Standort konnte nicht rechtzeitig ermittelt werden.',
    };
  }

  if (code === '2' || message.includes('unavailable') || message.includes('unsupported')) {
    return {
      reason: 'unavailable',
      message: 'Standort ist auf diesem Geraet nicht verfuegbar.',
    };
  }

  return {
    reason: 'unknown',
    message: 'Standort konnte nicht ermittelt werden.',
  };
};

class NativeLocationService implements LocationService {
  async getCurrentLocation(options?: LocationOptions): Promise<DeviceLocation | null> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 8000,
        maximumAge: options?.maximumAge ?? 30_000,
      });

      return toDeviceLocation(position.coords as GeolocationCoordinates, position.timestamp, 'native');
    } catch (error) {
      console.warn('[locationService] native location unavailable', toLocationFailure(error));
      return null;
    }
  }
}

class BrowserLocationService implements LocationService {
  async getCurrentLocation(options?: LocationOptions): Promise<DeviceLocation | null> {
    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(toDeviceLocation(position.coords, position.timestamp, 'browser')),
        (error) => {
          console.warn('[locationService] browser location unavailable', toLocationFailure(error));
          resolve(null);
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 8000,
          maximumAge: options?.maximumAge ?? 30_000,
        },
      );
    });
  }
}

export const locationService: LocationService = Capacitor.isNativePlatform()
  ? new NativeLocationService()
  : new BrowserLocationService();

export const getLocationFailure = (error: unknown): LocationFailure => toLocationFailure(error);
