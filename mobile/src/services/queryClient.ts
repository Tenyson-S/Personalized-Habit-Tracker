import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300_000, // 5 minutes
      retry: 2,
      // Exponential backoff: 1s, 2s (handles Railway cold starts gracefully)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
      // Default gcTime to 7 days for offline persistence
      gcTime: 7 * 24 * 60 * 60 * 1000,
    },
    mutations: {
      retry: 0, // Mutations managed by offline queue — don't double-retry
    },
  },
});

const memoryStorage = new Map<string, string>();

const safeWebStorage = {
  getItem: async (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback to memory
    }
    return memoryStorage.get(key) ?? null;
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback to memory
    }
    memoryStorage.set(key, value);
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback to memory
    }
    memoryStorage.delete(key);
  },
};

export const createScopedPersister = (userId: string | null) => {
  return createAsyncStoragePersister({
    storage: Platform.OS === 'web'
      ? safeWebStorage
      : AsyncStorage,
    key: `REACT_QUERY_OFFLINE_CACHE_${userId || 'GUEST'}`,
  });
};
