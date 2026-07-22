import { create } from 'zustand';
import type { Tokens } from '../types/api';
import { clearTokens, readTokens, saveTokens } from '../services/tokenStore';
// Static imports so Metro can correctly resolve the platform-specific files
// (.web.ts / .native.ts). Dynamic await import() does NOT work for this.
import { mutationQueue } from '../offline/queue/mutationQueue';
import { processSyncQueue } from '../offline/sync/syncEngine';
import { queryClient } from '../services/queryClient';

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
        await mutationQueue.initQueue();
        processSyncQueue(userId);
      }
    } catch {
      // Silently fail — token read error is non-fatal; user will be treated as unauthenticated
      set({ tokens: null, userId: null, hydrated: true });
    }
  },
  setTokens: async (tokens) => {
    await saveTokens(tokens);
    const userId = decodeUserId(tokens.access);
    set({ tokens, userId });

    // Initialize queue for the newly logged-in user
    if (userId) {
      await mutationQueue.initQueue();
      processSyncQueue(userId);
    }
  },
  signOut: async () => {
    await clearTokens();

    // Clear in-memory cache to prevent data leak to guest state.
    queryClient.clear();

    set({ tokens: null, userId: null });
  },
}));
