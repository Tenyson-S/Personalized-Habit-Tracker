import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthScreen } from '../features/auth/AuthScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/tokens';
import type { User } from '../types/api';
import { SwipeTabShell } from './SwipeTabShell';

import { GuideScreen } from '../features/guide/GuideScreen';
import { OfflineBanner } from '../components/OfflineBanner';

export function RootNavigator() {
  const tokens = useAuthStore((state) => state.tokens);
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<User>('/me/')).data,
    enabled: Boolean(tokens),
  });

  if (!tokens) return <AuthScreen />;
  if (me.isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator /></View>;
  }
  if (me.isError || !me.data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 20 }}>
        <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 12 }}>Could not connect to the server.</Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Please check your internet connection or try restarting the app.</Text>
      </View>
    );
  }

  const hasCompletedGuide = me.data?.profile?.has_completed_guide ?? true;
  
  if (!hasCompletedGuide) {
    return (
      <GuideScreen 
        onComplete={async () => {
          await api.post('/me/complete-guide/');
          queryClient.invalidateQueries({ queryKey: ['me'] });
        }} 
      />
    );
  }

  if (!me.data.profile?.onboarding_completed) return <OnboardingScreen />;
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <SwipeTabShell />
    </View>
  );
}
