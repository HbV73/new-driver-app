import { Capacitor } from '@capacitor/core';
import {
  Camera,
  CameraDirection,
  EncodingType,
} from '@capacitor/camera';

export type CapturedPhotoSource = 'native' | 'browser';

export interface CapturedPhoto {
  uri?: string;
  path?: string;
  webPath?: string;
  format: string;
  capturedAt: string;
  source: CapturedPhotoSource;
  file?: File;
}

export type CameraFailureReason =
  | 'permission-denied'
  | 'cancelled'
  | 'unavailable'
  | 'empty-result'
  | 'unknown';

export interface CameraFailure {
  reason: CameraFailureReason;
  message: string;
}

export interface CapturePhotoOptions {
  quality?: number;
  filenamePrefix?: string;
}

export interface CameraService {
  capturePhoto(options?: CapturePhotoOptions): Promise<CapturedPhoto>;
  toFile(photo: CapturedPhoto, fallbackName?: string): Promise<File>;
}

const nowIso = () => new Date().toISOString();

const extensionToMime = (format: string) => {
  const normalized = format.toLowerCase().replace(/^\./, '');
  if (normalized === 'jpg' || normalized === 'jpeg') return 'image/jpeg';
  if (normalized === 'png') return 'image/png';
  if (normalized === 'webp') return 'image/webp';
  if (normalized === 'gif') return 'image/gif';
  return 'image/jpeg';
};

const normalizeFormat = (format?: string, mime?: string) => {
  if (format) return format.replace(/^\./, '').toLowerCase();
  if (mime?.includes('/')) return mime.split('/')[1].replace('jpeg', 'jpg').toLowerCase();
  return 'jpg';
};

const toCameraFailure = (error: unknown): CameraFailure => {
  const candidate = error as { code?: string; message?: string };
  const message = candidate?.message ?? String(error ?? '');
  const normalized = `${candidate?.code ?? ''} ${message}`.toLowerCase();

  if (normalized.includes('cancel')) {
    return { reason: 'cancelled', message: 'Fotoaufnahme abgebrochen.' };
  }

  if (normalized.includes('permission') || normalized.includes('denied')) {
    return {
      reason: 'permission-denied',
      message: 'Kamerazugriff wurde abgelehnt. Bitte Berechtigung erlauben und erneut versuchen.',
    };
  }

  if (normalized.includes('no camera') || normalized.includes('unavailable')) {
    return { reason: 'unavailable', message: 'Kamera ist auf diesem Geraet nicht verfuegbar.' };
  }

  return { reason: 'unknown', message: 'Foto konnte nicht aufgenommen werden.' };
};

const createBrowserFileInput = () =>
  new Promise<File>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject({ reason: 'unavailable', message: 'Kamera ist im Browser nicht verfuegbar.' } satisfies CameraFailure);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.style.display = 'none';

    const cleanup = () => {
      window.setTimeout(() => input.remove(), 0);
      window.removeEventListener('focus', handleFocus);
    };

    const handleFocus = () => {
      window.setTimeout(() => {
        if (!input.files?.length) {
          cleanup();
          reject({ reason: 'cancelled', message: 'Fotoaufnahme abgebrochen.' } satisfies CameraFailure);
        }
      }, 500);
    };

    input.onchange = () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        reject({ reason: 'cancelled', message: 'Fotoaufnahme abgebrochen.' } satisfies CameraFailure);
        return;
      }
      resolve(file);
    };

    document.body.appendChild(input);
    window.addEventListener('focus', handleFocus);
    input.click();
  });

class NativeCameraService implements CameraService {
  async capturePhoto(options?: CapturePhotoOptions): Promise<CapturedPhoto> {
    try {
      const result = await Camera.takePhoto({
        quality: options?.quality ?? 80,
        correctOrientation: true,
        encodingType: EncodingType.JPEG,
        saveToGallery: false,
        cameraDirection: CameraDirection.Rear,
        editable: 'no',
        includeMetadata: true,
      });

      const format = normalizeFormat(result.metadata?.format);
      if (!result.uri && !result.webPath) {
        throw { reason: 'empty-result', message: 'Kein Foto erhalten.' } satisfies CameraFailure;
      }

      return {
        uri: result.uri,
        path: result.uri,
        webPath: result.webPath,
        format,
        capturedAt: result.metadata?.creationDate ?? nowIso(),
        source: 'native',
      };
    } catch (error) {
      const failure = (error as CameraFailure)?.reason
        ? (error as CameraFailure)
        : toCameraFailure(error);
      throw failure;
    }
  }

  async toFile(photo: CapturedPhoto, fallbackName = 'photo'): Promise<File> {
    if (photo.file) return photo.file;

    const source = photo.webPath ?? photo.uri ?? photo.path;
    if (!source) {
      throw { reason: 'empty-result', message: 'Kein Foto zum Hochladen gefunden.' } satisfies CameraFailure;
    }

    const response = await fetch(source);
    const blob = await response.blob();
    const format = normalizeFormat(photo.format, blob.type);
    return new File([blob], `${fallbackName}.${format}`, { type: blob.type || extensionToMime(format) });
  }
}

class BrowserCameraService implements CameraService {
  async capturePhoto(options?: CapturePhotoOptions): Promise<CapturedPhoto> {
    try {
      const file = await createBrowserFileInput();
      const format = normalizeFormat(undefined, file.type);
      const webPath = URL.createObjectURL(file);

      return {
        uri: webPath,
        webPath,
        format,
        capturedAt: new Date(file.lastModified || Date.now()).toISOString(),
        source: 'browser',
        file,
      };
    } catch (error) {
      const failure = (error as CameraFailure)?.reason
        ? (error as CameraFailure)
        : toCameraFailure(error);
      throw failure;
    }
  }

  async toFile(photo: CapturedPhoto, fallbackName = 'photo'): Promise<File> {
    if (photo.file) return photo.file;

    const source = photo.webPath ?? photo.uri ?? photo.path;
    if (!source) {
      throw { reason: 'empty-result', message: 'Kein Foto zum Hochladen gefunden.' } satisfies CameraFailure;
    }

    const response = await fetch(source);
    const blob = await response.blob();
    const format = normalizeFormat(photo.format, blob.type);
    return new File([blob], `${fallbackName}.${format}`, { type: blob.type || extensionToMime(format) });
  }
}

export const cameraService: CameraService = Capacitor.isNativePlatform()
  ? new NativeCameraService()
  : new BrowserCameraService();

export const getCameraFailure = (error: unknown): CameraFailure => {
  const failure = error as Partial<CameraFailure>;
  if (failure.reason && failure.message) {
    return failure as CameraFailure;
  }

  return toCameraFailure(error);
};
