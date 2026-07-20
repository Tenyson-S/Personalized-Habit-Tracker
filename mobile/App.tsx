import React, { Component, useEffect, useState } from 'react';
import { Platform, View, StyleSheet, Text, Pressable, ActivityIndicator } from 'react-native';
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
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';

// ─── Error Boundary ──────────────────────────────────────────────────────────
class AppErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'The application encountered an unexpected error.'}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Reload App</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const userId = useAuthStore((state) => state.userId);
  const initConnectivityListener = useConnectivityStore((state) => state.initConnectivityListener);
  const [showSplash, setShowSplash] = useState(true);

  // Create persister guaranteed to work across WebViews
  const persister = React.useMemo(() => createScopedPersister(userId), [userId]);

  useEffect(() => {
    // Timeout fallback: Force hydrated to true after 1.5s if storage stalls
    const timeout = setTimeout(() => {
      useAuthStore.setState({ hydrated: true });
    }, 1500);

    hydrate()
      .catch((err) => console.error('Hydration error:', err))
      .finally(() => clearTimeout(timeout));

    const unsubscribe = initConnectivityListener();
    return () => {
      unsubscribe();
    };
  }, [hydrate, initConnectivityListener]);

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#668061" />
      </View>
    );
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
  const { isMobile, isTablet } = useResponsive();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  if (isMobile || isTablet) {
    return (
      <View style={[styles.mobileOuter, { backgroundColor: colors.background }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.desktopOuter, { backgroundColor: colors.elevatedBackground }]}>
      <View style={[styles.desktopInner, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    // If google fonts take more than 1.5s to load in WebView, unblock rendering with fallback font
    const timer = setTimeout(() => setFontTimedOut(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError && !fontTimedOut) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#668061" />
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <DesktopWrapper>
            <AppContent />
          </DesktopWrapper>
        </ThemeProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D0F0E',
    alignItems: 'center',
    justify: 'center',
  },
  mobileOuter: {
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#F5F2EA',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#A5AAA3',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#85A67F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
  },
  retryButtonText: {
    color: '#121212',
    fontWeight: '700',
  },
});
