import { create } from 'zustand';
import type { Tokens } from '../types/api';
import { clearTokens, readTokens, saveTokens } from '../services/tokenStore';

type AuthState = {
  hydrated: boolean;
  tokens: Tokens | null;
  hydrate: () => Promise<void>;
  setTokens: (tokens: Tokens) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  tokens: null,
  hydrate: async () => {
    try {
      const tokens = await readTokens();
      set({ tokens, hydrated: true });
    } catch (error) {
      console.error('Failed to read auth tokens', error);
      set({ tokens: null, hydrated: true });
    }
  },
  setTokens: async (tokens) => {
    await saveTokens(tokens);
    set({ tokens });
  },
  signOut: async () => {
    await clearTokens();
    set({ tokens: null });
  },
}));
