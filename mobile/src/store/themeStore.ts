import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppTheme = 'SYSTEM' | 'LIGHT' | 'DARK';

type ThemeState = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'SYSTEM',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'app-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
