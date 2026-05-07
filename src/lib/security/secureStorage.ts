import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const memoryFallback = new Map<string, string>();

const hasLocalStorage = () => {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
};

export async function getSecure(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  }

  if (hasLocalStorage()) return localStorage.getItem(key);
  return memoryFallback.get(key) ?? null;
}

export async function setSecure(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
    return;
  }

  if (hasLocalStorage()) {
    localStorage.setItem(key, value);
    return;
  }

  memoryFallback.set(key, value);
}

export async function removeSecure(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
    return;
  }

  if (hasLocalStorage()) {
    localStorage.removeItem(key);
    return;
  }

  memoryFallback.delete(key);
}
