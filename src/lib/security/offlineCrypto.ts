import { getSecure, setSecure } from './secureStorage';

const OFFLINE_KEY_STORAGE = 'rs_offline_data_key_v1';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

type EncryptedRecord = {
  __encrypted: true;
  version: 'aes-gcm-v1';
  iv: string;
  data: string;
};

const isEncryptedRecord = (value: unknown): value is EncryptedRecord =>
  Boolean(value && typeof value === 'object' && (value as { __encrypted?: unknown }).__encrypted === true);

function bytesToBase64(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  array.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getOfflineKey(): Promise<CryptoKey> {
  let raw = await getSecure(OFFLINE_KEY_STORAGE);
  if (!raw) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    raw = bytesToBase64(bytes);
    await setSecure(OFFLINE_KEY_STORAGE, raw);
  }

  return crypto.subtle.importKey(
    'raw',
    base64ToBytes(raw),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptOfflineRecord<T>(value: T): Promise<T | EncryptedRecord> {
  if (value == null || isEncryptedRecord(value)) return value as T;

  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const key = await getOfflineKey();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(value)),
  );

  return {
    __encrypted: true,
    version: 'aes-gcm-v1',
    iv: bytesToBase64(iv),
    data: bytesToBase64(ciphertext),
  };
}

export async function decryptOfflineRecord<T>(value: T | EncryptedRecord | undefined): Promise<T | undefined> {
  if (value == null) return value as T | undefined;
  if (!isEncryptedRecord(value)) return value as T;

  const key = await getOfflineKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(value.iv) },
    key,
    base64ToBytes(value.data),
  );

  return JSON.parse(decoder.decode(plaintext)) as T;
}
