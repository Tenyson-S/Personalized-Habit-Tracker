import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { AuthScreen } from '../features/auth/AuthScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { TodayScreen } from '../features/today/TodayScreen';
import { VillageScreen } from '../features/village/VillageScreen';
import { JourneyScreen } from '../features/journey/JourneyScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/tokens';
import type { User } from '../types/api';
import { TabIcon } from './TabIcon';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const tokens = useAuthStore((state) => state.tokens);
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<User>('/me/')).data,
    enabled: Boolean(tokens),
  });

  if (!tokens) return <AuthScreen />;
  if (me.isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator /></View>;
  if (me.data && !me.data.profile?.onboarding_completed) return <OnboardingScreen />;

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 70, paddingBottom: 8, paddingTop: 6 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      tabBarIcon: ({ color, focused }) => <TabIcon name={route.name} color={color} focused={focused} />,
    })}>
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Village" component={VillageScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
