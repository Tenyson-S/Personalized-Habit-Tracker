import { create } from 'zustand';
import { api } from '../services/api';
import type { UserSettings } from '../types/api';

type SettingsState = {
  settings: UserSettings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  clearSettings: () => void;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<UserSettings>('/me/settings/');
      set({ settings: res.data });
    } catch {
      // Silently fail — settings fetch is non-blocking
    } finally {
      set({ isLoading: false });
    }
  },
  updateSettings: async (updates) => {
    const previous = get().settings;
    if (previous) set({ settings: { ...previous, ...updates } });
    
    try {
      const res = await api.patch<UserSettings>('/me/settings/', updates);
      set({ settings: res.data });
    } catch {
      // Silently revert optimistic update on failure
      if (previous) set({ settings: previous });
    }
  },
  clearSettings: () => set({ settings: null }),
}));
