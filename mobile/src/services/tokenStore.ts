import { Platform } from 'react-native';
import type { Tokens } from '../types/api';

const ACCESS_KEY = 'village.access';
const REFRESH_KEY = 'village.refresh';

const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Fall back to in-memory store if localStorage throws in restricted WebViews
  }
  return memoryStore.get(key) ?? null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fall back to in-memory store
  }
  memoryStore.set(key, value);
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
  } catch {
    // Fall back to in-memory store
  }
  memoryStore.delete(key);
}

// expo-secure-store is not available on web — use safe storage instead
async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  return await import('expo-secure-store');
}

export async function saveTokens(tokens: Tokens) {
  if (Platform.OS === 'web') {
    safeSetItem(ACCESS_KEY, tokens.access);
    if (tokens.refresh) {
      safeSetItem(REFRESH_KEY, tokens.refresh);
    }
    return;
  }
  const SecureStore = await getSecureStore();
  if (!SecureStore) return;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.access),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh),
  ]);
}

export async function readTokens(): Promise<Tokens | null> {
  if (Platform.OS === 'web') {
    const access = safeGetItem(ACCESS_KEY);
    const refresh = safeGetItem(REFRESH_KEY);
    return access && refresh ? { access, refresh } : null;
  }
  const SecureStore = await getSecureStore();
  if (!SecureStore) return null;
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return access && refresh ? { access, refresh } : null;
}

export async function clearTokens() {
  if (Platform.OS === 'web') {
    safeRemoveItem(ACCESS_KEY);
    safeRemoveItem(REFRESH_KEY);
    return;
  }
  const SecureStore = await getSecureStore();
  if (!SecureStore) return;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
