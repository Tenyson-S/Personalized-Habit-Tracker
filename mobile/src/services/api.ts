import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000/api';

export const api = axios.create({ baseURL, timeout: 10_000 });

import { useConnectivityStore } from '../offline/network/connectivityStore';
import { mutationQueue } from '../offline/queue/mutationQueue';

api.interceptors.request.use((config) => {
  const access = useAuthStore.getState().tokens?.access;
  if (access) config.headers.Authorization = `Bearer ${access}`;
  
  // Inject Idempotency-Key if this is a mutation and we're online
  // If we're offline, the adapter will inject it before saving to the queue
  if (config.method !== 'get' && !config.headers['Idempotency-Key']) {
    config.headers['Idempotency-Key'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return config;
});

const originalAdapter = api.defaults.adapter;
api.defaults.adapter = async (config) => {
  const isOnline = useConnectivityStore.getState().isInternetReachable;
  const isMutation = config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase());
  
  if (isOnline === false && isMutation) {
    const auth = useAuthStore.getState();
    if (auth.userId) {
      const idempotencyKey = config.headers['Idempotency-Key'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await mutationQueue.pushMutation({
        userId: auth.userId,
        method: config.method || 'post',
        url: config.url || '',
        payload: config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : '',
        idempotencyKey: String(idempotencyKey)
      });
      
      const { setPendingCount, pendingMutationCount } = useConnectivityStore.getState();
      setPendingCount(pendingMutationCount + 1);

      // Return fake success response to trigger optimistic updates in useMutation.onSuccess
      return {
        data: { _offline: true, id: `offline-${Date.now()}` },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      } as any;
    }
  }
  
  return originalAdapter!(config);
};

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      const { Alert } = require('react-native');
      Alert.alert('Connection Error', 'Please check your internet connection and try again.');
      throw error;
    }

    const original = error.config;
    const store = useAuthStore.getState();
    if (error.response?.status !== 401 || original?._retry || !store.tokens?.refresh) {
      throw error;
    }
    original._retry = true;
    refreshing ??= axios
      .post(`${baseURL}/auth/refresh/`, { refresh: store.tokens.refresh })
      .then(async ({ data }) => {
        const tokens = { access: data.access, refresh: data.refresh ?? store.tokens!.refresh };
        await useAuthStore.getState().setTokens(tokens);
        return tokens.access;
      })
      .finally(() => { refreshing = null; });

    try {
      const access = await refreshing;
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch (refreshError) {
      const { queryClient } = require('./queryClient');
      queryClient.clear();
      await useAuthStore.getState().signOut();
      throw refreshError;
    }
  },
);
