import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AuthScreen } from '../features/auth/AuthScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/tokens';
import type { User } from '../types/api';
import { SwipeTabShell } from './SwipeTabShell';

export function RootNavigator() {
  const tokens = useAuthStore((state) => state.tokens);
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<User>('/me/')).data,
    enabled: Boolean(tokens),
  });

  if (!tokens) return <AuthScreen />;
  if (me.isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator /></View>;
  }
  if (me.data && !me.data.profile?.onboarding_completed) return <OnboardingScreen />;
  return <SwipeTabShell />;
}
