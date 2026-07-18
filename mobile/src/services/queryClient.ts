import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300_000, // 5 minutes
      retry: 1,
      // Default gcTime to 7 days for persistence
      gcTime: 7 * 24 * 60 * 60 * 1000,
    },
  },
});

export const createScopedPersister = (userId: string | null) => {
  return createAsyncStoragePersister({
    storage: Platform.OS === 'web' 
      ? typeof window !== 'undefined' ? window.localStorage : undefined
      : AsyncStorage,
    key: `REACT_QUERY_OFFLINE_CACHE_${userId || 'GUEST'}`,
  });
};
