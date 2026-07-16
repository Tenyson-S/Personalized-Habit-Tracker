import { Platform } from 'react-native';
import type { Tokens } from '../types/api';

const ACCESS_KEY = 'village.access';
const REFRESH_KEY = 'village.refresh';

// expo-secure-store is not available on web — use localStorage instead
// We lazy-import SecureStore so the native module is never referenced on web
async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  return await import('expo-secure-store');
}

export async function saveTokens(tokens: Tokens) {
  if (Platform.OS === 'web') {
    localStorage.setItem(ACCESS_KEY, tokens.access);
    if (tokens.refresh) {
      localStorage.setItem(REFRESH_KEY, tokens.refresh);
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
    const access = localStorage.getItem(ACCESS_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
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
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    return;
  }
  const SecureStore = await getSecureStore();
  if (!SecureStore) return;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
