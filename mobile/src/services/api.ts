import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000/api';

export const api = axios.create({ baseURL, timeout: 10_000 });

api.interceptors.request.use((config) => {
  const access = useAuthStore.getState().tokens?.access;
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
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
      await useAuthStore.getState().signOut();
      throw refreshError;
    }
  },
);
