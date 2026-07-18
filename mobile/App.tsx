import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandSplash } from './src/components/BrandSplash';
import { GuideScreen } from './src/features/guide/GuideScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, createScopedPersister } from './src/services/queryClient';

function AppContent() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const userId = useAuthStore((state) => state.userId);
  const initConnectivityListener = require('./src/offline/network/connectivityStore').useConnectivityStore((state: any) => state.initConnectivityListener);
  const [showSplash, setShowSplash] = useState(true);

  // Create a new persister whenever the userId changes to guarantee cache isolation
  const persister = React.useMemo(() => createScopedPersister(userId), [userId]);

  useEffect(() => {
    hydrate();
    const unsubscribe = initConnectivityListener();
    return () => {
      unsubscribe();
    };
  }, [hydrate, initConnectivityListener]);

  if (!hydrated) {
    return null; // Keep screen blank/native splash until hydration resolves
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: userId || 'v1', // changing buster forces cache invalidation across users if same persister was used
      }}
    >
      <NavigationContainer documentTitle={{ formatter: () => 'Stealth Track' }}>
        <RootNavigator />
      </NavigationContainer>
      {showSplash && <BrandSplash onFinished={() => setShowSplash(false)} />}
    </PersistQueryClientProvider>
  );
}

function DesktopWrapper({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={[styles.desktopOuter, { backgroundColor: colors.elevatedBackground }]}>
      <View style={[styles.desktopInner, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopOuter: {
    flex: 1,
    alignItems: 'center',
  },
  desktopInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 30,
  }
});

import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DesktopWrapper>
          <AppContent />
        </DesktopWrapper>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
