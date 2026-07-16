import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './tokens';
import { useThemeStore } from '../store/themeStore';

type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const settingsTheme = useThemeStore(state => state.theme);
  
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (settingsTheme === 'DARK') {
      setIsDark(true);
    } else if (settingsTheme === 'LIGHT') {
      setIsDark(false);
    } else {
      setIsDark(systemColorScheme === 'dark');
    }
  }, [settingsTheme, systemColorScheme]);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
