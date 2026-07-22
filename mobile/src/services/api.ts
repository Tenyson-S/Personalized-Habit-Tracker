import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useConnectivityStore } from '../offline/network/connectivityStore';
import { mutationQueue } from '../offline/queue/mutationQueue';
import { queryClient } from './queryClient';

function resolveApiBaseUrl(value?: string) {
  if (!value) {
    throw new Error('[Stealth Track] EXPO_PUBLIC_API_URL is not configured.');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('[Stealth Track] EXPO_PUBLIC_API_URL must be an absolute HTTPS URL.');
  }

  const blockedHosts = new Set(['localhost', '127.0.0.1', '10.0.2.2', '0.0.0.0']);
  if (parsed.protocol !== 'https:' || blockedHosts.has(parsed.hostname)) {
    throw new Error('[Stealth Track] EXPO_PUBLIC_API_URL must point to the production HTTPS API.');
  }

  return parsed.toString().replace(/\/$/, '');
}

const baseURL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

export const api = axios.create({
  baseURL,
  timeout: 30_000,
});

class QueuedMutationResponseError extends Error {
  queuedResponse: any;

  constructor(queuedResponse: any) {
    super('QueuedMutationResponseError');
    this.name = 'QueuedMutationResponseError';
    this.queuedResponse = queuedResponse;
  }
}

api.interceptors.request.use(async (config) => {
  const access = useAuthStore.getState().tokens?.access;
  if (access) config.headers.Authorization = `Bearer ${access}`;

  if (config.method !== 'get' && !config.headers['Idempotency-Key']) {
    config.headers['Idempotency-Key'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const isOnline = useConnectivityStore.getState().isInternetReachable;
  const isMutation = config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase());

  if (isOnline === false && isMutation) {
    const auth = useAuthStore.getState();
    if (auth.userId) {
      const idempotencyKey = config.headers['Idempotency-Key'];

      await mutationQueue.pushMutation({
        userId: auth.userId,
        method: config.method || 'post',
        url: config.url || '',
        payload: config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : '',
        idempotencyKey: String(idempotencyKey),
      });

      const { setPendingCount, pendingMutationCount } = useConnectivityStore.getState();
      setPendingCount(pendingMutationCount + 1);

      throw new QueuedMutationResponseError({
        data: { _offline: true, id: `offline-${Date.now()}` },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      });
    }
  }

  return config;
});

let refreshing: Promise<string> | null = null;

function isTransientError(error: AxiosError): boolean {
  const status = error.response?.status;
  return status === 502 || status === 503 || status === 504;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error && error.name === 'QueuedMutationResponseError') {
      return error.queuedResponse;
    }

    if (!error.response) {
      throw error;
    }

    if (isTransientError(error)) {
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
      .finally(() => {
        refreshing = null;
      });

    try {
      const access = await refreshing;
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch (refreshError) {
      queryClient.clear();
      await useAuthStore.getState().signOut();
      throw refreshError;
    }
  },
);
