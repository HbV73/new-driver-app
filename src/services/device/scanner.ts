import { Capacitor } from '@capacitor/core';
import {
  BarcodeFormat,
  BarcodeScanner,
} from '@capacitor-mlkit/barcode-scanning';

export type ScannerResultSource = 'native' | 'browser' | 'manual';

export interface ScannerResult {
  code: string;
  format?: string;
  scannedAt: string;
  source: ScannerResultSource;
}

export type ScannerPermissionState =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'prompt-with-rationale'
  | 'limited'
  | 'unavailable';

export type ScannerFailureReason =
  | 'unsupported'
  | 'permission-denied'
  | 'cancelled'
  | 'empty-result'
  | 'unavailable'
  | 'unknown';

export interface ScannerFailure {
  reason: ScannerFailureReason;
  message: string;
}

export interface ScannerService {
  scanCode(): Promise<ScannerResult>;
  checkPermission(): Promise<ScannerPermissionState>;
  requestPermission(): Promise<ScannerPermissionState>;
  createManualResult(code: string): ScannerResult;
}

const CONTAINER_FORMATS = [
  BarcodeFormat.QrCode,
  BarcodeFormat.Code128,
  BarcodeFormat.Code39,
  BarcodeFormat.Code93,
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.DataMatrix,
];

const normalizeCode = (code: string) => code.trim();

const nowIso = () => new Date().toISOString();

const toPermissionState = (state?: string): ScannerPermissionState => {
  if (
    state === 'granted' ||
    state === 'denied' ||
    state === 'prompt' ||
    state === 'prompt-with-rationale' ||
    state === 'limited'
  ) {
    return state;
  }

  return 'unavailable';
};

const toScannerFailure = (error: unknown): ScannerFailure => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();

  if (normalized.includes('cancel')) {
    return { reason: 'cancelled', message: 'Scan abgebrochen.' };
  }

  if (normalized.includes('permission') || normalized.includes('denied')) {
    return {
      reason: 'permission-denied',
      message: 'Kamerazugriff wurde abgelehnt. Bitte manuell eingeben oder Berechtigung erlauben.',
    };
  }

  return {
    reason: 'unknown',
    message: 'Der Scan konnte nicht gestartet werden. Bitte manuell eingeben.',
  };
};

class NativeScannerService implements ScannerService {
  async checkPermission(): Promise<ScannerPermissionState> {
    const { camera } = await BarcodeScanner.checkPermissions();
    return toPermissionState(camera);
  }

  async requestPermission(): Promise<ScannerPermissionState> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return toPermissionState(camera);
  }

  async scanCode(): Promise<ScannerResult> {
    const { supported } = await BarcodeScanner.isSupported();
    if (!supported) {
      throw {
        reason: 'unsupported',
        message: 'Barcode-Scanner wird auf diesem Gerät nicht unterstützt.',
      } satisfies ScannerFailure;
    }

    let permission = await this.checkPermission();
    if (permission !== 'granted') {
      permission = await this.requestPermission();
    }

    if (permission !== 'granted') {
      throw {
        reason: 'permission-denied',
        message: 'Kamerazugriff wurde abgelehnt. Bitte manuell eingeben oder Berechtigung erlauben.',
      } satisfies ScannerFailure;
    }

    try {
      const result = await BarcodeScanner.scan({
        formats: CONTAINER_FORMATS,
        autoZoom: true,
      });
      const barcode = result.barcodes.find((item) => normalizeCode(item.rawValue || item.displayValue));
      const code = normalizeCode(barcode?.rawValue || barcode?.displayValue || '');

      if (!code) {
        throw {
          reason: 'empty-result',
          message: 'Kein lesbarer Code erkannt. Bitte erneut scannen oder manuell eingeben.',
        } satisfies ScannerFailure;
      }

      return {
        code,
        format: barcode?.format,
        scannedAt: nowIso(),
        source: 'native',
      };
    } catch (error) {
      const failure = (error as ScannerFailure)?.reason
        ? (error as ScannerFailure)
        : toScannerFailure(error);
      throw failure;
    }
  }

  createManualResult(code: string): ScannerResult {
    const normalized = normalizeCode(code);
    if (!normalized) {
      throw {
        reason: 'empty-result',
        message: 'Bitte einen gültigen Behältercode eingeben.',
      } satisfies ScannerFailure;
    }

    return {
      code: normalized,
      scannedAt: nowIso(),
      source: 'manual',
    };
  }
}

class BrowserScannerService implements ScannerService {
  async checkPermission(): Promise<ScannerPermissionState> {
    return 'unavailable';
  }

  async requestPermission(): Promise<ScannerPermissionState> {
    return 'unavailable';
  }

  async scanCode(): Promise<ScannerResult> {
    throw {
      reason: 'unavailable',
      message: 'Scanner ist im Browser nicht verfügbar. Bitte den Behältercode manuell eingeben.',
    } satisfies ScannerFailure;
  }

  createManualResult(code: string): ScannerResult {
    const normalized = normalizeCode(code);
    if (!normalized) {
      throw {
        reason: 'empty-result',
        message: 'Bitte einen gültigen Behältercode eingeben.',
      } satisfies ScannerFailure;
    }

    return {
      code: normalized,
      scannedAt: nowIso(),
      source: 'manual',
    };
  }
}

export const scannerService: ScannerService = Capacitor.isNativePlatform()
  ? new NativeScannerService()
  : new BrowserScannerService();

export const getScannerFailure = (error: unknown): ScannerFailure => {
  const failure = error as Partial<ScannerFailure>;
  if (failure.reason && failure.message) {
    return failure as ScannerFailure;
  }

  return toScannerFailure(error);
};
