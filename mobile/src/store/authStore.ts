import { create } from 'zustand';
import type { Tokens } from '../types/api';
import { clearTokens, readTokens, saveTokens } from '../services/tokenStore';

type AuthState = {
  hydrated: boolean;
  tokens: Tokens | null;
  userId: string | null;
  hydrate: () => Promise<void>;
  setTokens: (tokens: Tokens) => Promise<void>;
  signOut: () => Promise<void>;
};

export function decodeUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.user_id ? String(decoded.user_id) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  tokens: null,
  userId: null,
  hydrate: async () => {
    try {
      const tokens = await readTokens();
      const userId = decodeUserId(tokens?.access || null);
      set({ tokens, userId, hydrated: true });
      
      if (userId) {
        const { mutationQueue } = require('../offline/queue/mutationQueue');
        await mutationQueue.initQueue();
        
        const { processSyncQueue } = require('../offline/sync/syncEngine');
        processSyncQueue(userId);
      }
    } catch (error) {
      console.error('Failed to read auth tokens', error);
      set({ tokens: null, userId: null, hydrated: true });
    }
  },
  setTokens: async (tokens) => {
    await saveTokens(tokens);
    set({ tokens, userId: decodeUserId(tokens.access) });
  },
  signOut: async () => {
    await clearTokens();
    
    // Clear in-memory cache to prevent data leak to guest state.
    // The persisted cache in AsyncStorage remains securely isolated via the userId key prefix,
    // so it will be restored if the user logs back in.
    const { queryClient } = require('../services/queryClient');
    queryClient.clear();
    
    set({ tokens: null, userId: null });
  },
}));
