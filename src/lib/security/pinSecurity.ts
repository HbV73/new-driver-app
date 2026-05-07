import { getSecure, removeSecure, setSecure } from './secureStorage';

export const PIN_STORAGE_KEY = 'rs_pin_record_v2';
export const PIN_LEGACY_STORAGE_KEY = 'rs_pin_hash';
export const PIN_SESSION_KEY = 'rs_pin_session';
export const BIOMETRIC_KEY = 'rs_biometric_enabled';

const PIN_ITERATIONS = 150_000;
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 10 * 60 * 1000;
const PIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

type PinRecord = {
  version: 'pbkdf2-v1';
  hash: string;
  salt: string;
  iterations: number;
  attempts: number;
  lockoutUntil: number | null;
  createdAt: number;
  updatedAt: number;
};

type PinSession = {
  active: true;
  expiresAt: number;
};

const encoder = new TextEncoder();

function bytesToBase64(bytes: ArrayBuffer): string {
  const array = new Uint8Array(bytes);
  let binary = '';
  array.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes.buffer);
}

async function derivePinHash(pin: string, salt: string, iterations = PIN_ITERATIONS): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`${salt}:${pin}`),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return bytesToBase64(bits);
}

function legacyHashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

async function getPinRecord(): Promise<PinRecord | null> {
  const raw = await getSecure(PIN_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PinRecord;
    return parsed.version === 'pbkdf2-v1' ? parsed : null;
  } catch {
    return null;
  }
}

async function savePinRecord(record: PinRecord): Promise<void> {
  await setSecure(PIN_STORAGE_KEY, JSON.stringify(record));
}

export async function isPinSetup(): Promise<boolean> {
  return Boolean(await getPinRecord() ?? await getSecure(PIN_LEGACY_STORAGE_KEY));
}

export async function setPin(pin: string): Promise<void> {
  const now = Date.now();
  const salt = randomSalt();
  const record: PinRecord = {
    version: 'pbkdf2-v1',
    hash: await derivePinHash(pin, salt),
    salt,
    iterations: PIN_ITERATIONS,
    attempts: 0,
    lockoutUntil: null,
    createdAt: now,
    updatedAt: now,
  };
  await savePinRecord(record);
  await removeSecure(PIN_LEGACY_STORAGE_KEY);
}

export async function verifyPin(pin: string): Promise<{
  ok: boolean;
  lockedUntil?: number;
  attemptsRemaining?: number;
}> {
  const record = await getPinRecord();
  const now = Date.now();

  if (!record) {
    const legacyHash = await getSecure(PIN_LEGACY_STORAGE_KEY);
    if (legacyHash && legacyHashPin(pin) === legacyHash) {
      await setPin(pin);
      return { ok: true, attemptsRemaining: PIN_MAX_ATTEMPTS };
    }
    return { ok: false, attemptsRemaining: PIN_MAX_ATTEMPTS - 1 };
  }

  if (record.lockoutUntil && record.lockoutUntil > now) {
    return { ok: false, lockedUntil: record.lockoutUntil, attemptsRemaining: 0 };
  }

  const hash = await derivePinHash(pin, record.salt, record.iterations);
  if (hash === record.hash) {
    await savePinRecord({ ...record, attempts: 0, lockoutUntil: null, updatedAt: now });
    return { ok: true, attemptsRemaining: PIN_MAX_ATTEMPTS };
  }

  const attempts = record.attempts + 1;
  const lockoutUntil = attempts >= PIN_MAX_ATTEMPTS ? now + PIN_LOCKOUT_MS : null;
  await savePinRecord({ ...record, attempts, lockoutUntil, updatedAt: now });

  return {
    ok: false,
    lockedUntil: lockoutUntil ?? undefined,
    attemptsRemaining: Math.max(0, PIN_MAX_ATTEMPTS - attempts),
  };
}

export async function setPinSessionActive(): Promise<void> {
  const session: PinSession = { active: true, expiresAt: Date.now() + PIN_SESSION_TTL_MS };
  await setSecure(PIN_SESSION_KEY, JSON.stringify(session));
}

export async function isPinSessionActive(): Promise<boolean> {
  const raw = await getSecure(PIN_SESSION_KEY);
  if (!raw) return false;

  try {
    const session = JSON.parse(raw) as PinSession;
    if (session.active && session.expiresAt > Date.now()) return true;
  } catch {
    if (raw === 'active') {
      await removeSecure(PIN_SESSION_KEY);
    }
  }

  return false;
}

export async function clearPinSession(): Promise<void> {
  await removeSecure(PIN_SESSION_KEY);
}

export async function clearPinData(): Promise<void> {
  await Promise.all([
    removeSecure(PIN_STORAGE_KEY),
    removeSecure(PIN_LEGACY_STORAGE_KEY),
    removeSecure(PIN_SESSION_KEY),
    removeSecure(BIOMETRIC_KEY),
  ]);
}
