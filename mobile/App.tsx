import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useResponsive, DESKTOP_WRAPPER_MAX_WIDTH } from './src/hooks/useResponsive';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandSplash } from './src/components/BrandSplash';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useConnectivityStore } from './src/offline/network/connectivityStore';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, createScopedPersister } from './src/services/queryClient';

function AppContent() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const userId = useAuthStore((state) => state.userId);
  const initConnectivityListener = useConnectivityStore((state) => state.initConnectivityListener);
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
        buster: userId || 'v1',
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
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // Mobile: full viewport width, no chrome
  if (isMobile) {
    return (
      <View style={[styles.mobileOuter, { backgroundColor: colors.background }]}>
        {children}
      </View>
    );
  }

  // Tablet: full width, subtle outer background
  if (isTablet) {
    return (
      <View style={[styles.tabletOuter, { backgroundColor: colors.background }]}>
        {children}
      </View>
    );
  }

  // Desktop: centered at DESKTOP_WRAPPER_MAX_WIDTH with border + shadow
  return (
    <View style={[styles.desktopOuter, { backgroundColor: colors.elevatedBackground }]}>
      <View style={[styles.desktopInner, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileOuter: {
    flex: 1,
    width: '100%',
  },
  tabletOuter: {
    flex: 1,
    width: '100%',
  },
  desktopOuter: {
    flex: 1,
    alignItems: 'center',
  },
  desktopInner: {
    flex: 1,
    width: '100%',
    maxWidth: DESKTOP_WRAPPER_MAX_WIDTH,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 40,
  },
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
