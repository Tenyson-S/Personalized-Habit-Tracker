import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandSplash } from './src/components/BrandSplash';
import { GuideScreen } from './src/features/guide/GuideScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { ThemeProvider } from './src/theme/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function AppContent() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (showSplash) {
    return <BrandSplash onFinished={() => setShowSplash(false)} />;
  }

  if (!hydrated) {
    return null; // Keep screen blank/native splash until hydration resolves
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer documentTitle={{ formatter: () => 'Stealth Track' }}>
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}

import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
