import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandSplash } from './src/components/BrandSplash';
import { GuideScreen } from './src/features/guide/GuideScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useGuide } from './src/hooks/useGuide';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

type AppPhase = 'splash' | 'guide' | 'app';

function AppContent() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const { status: guideStatus, completeGuide } = useGuide();
  const [phase, setPhase] = useState<AppPhase>('splash');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function handleSplashFinished() {
    if (!hydrated) {
      // Hydration hasn't finished yet — wait; will re-evaluate once hydrated
      return;
    }
    advanceFromSplash();
  }

  function advanceFromSplash() {
    if (guideStatus === 'show') {
      setPhase('guide');
    } else if (guideStatus === 'done' || guideStatus === 'loading') {
      // loading means check not done yet — go straight to app, guide will skip
      setPhase('app');
    }
  }

  // If hydration finishes while still on splash, move forward
  useEffect(() => {
    if (hydrated && phase === 'splash') {
      // Don't cut the splash short — only advance if splash has called onFinished
      // This effect handles the race where hydration is slower than the animation
    }
  }, [hydrated, phase]);

  // Guide status resolved — if we're already past splash and guide should show
  useEffect(() => {
    if (phase === 'app' && guideStatus === 'show') {
      setPhase('guide');
    }
  }, [guideStatus, phase]);

  async function handleGuideComplete() {
    await completeGuide();
    setPhase('app');
  }

  if (phase === 'splash') {
    return (
      <BrandSplash
        onFinished={() => {
          if (hydrated) {
            advanceFromSplash();
          } else {
            // Hydration still in progress — show app skeleton (hydrate resolves quickly)
            setPhase('app');
          }
        }}
      />
    );
  }

  if (phase === 'guide') {
    return <GuideScreen onComplete={handleGuideComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer documentTitle={{ formatter: () => 'Stealth Track' }}>
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
