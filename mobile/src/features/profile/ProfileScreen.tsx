import React from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing } from '../../theme/tokens';
import type { User } from '../../types/api';

export function ProfileScreen() {
  const queryClient = useQueryClient();
  const signOut = useAuthStore((state) => state.signOut);
  const me = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get<User>('/me/')).data });

  async function logout() {
    try {
      const refresh = useAuthStore.getState().tokens?.refresh;
      if (refresh) await api.post('/auth/logout/', { refresh });
    } catch {
      // Local sign-out still proceeds; an expired refresh token should not trap the user.
    }
    await signOut();
    queryClient.clear();
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>YOU</Text>
      <Text style={styles.title}>Your life stays yours.</Text>
      <Card>
        <Text style={styles.name}>{me.data?.display_name || 'Hearth resident'}</Text>
        <Text style={styles.muted}>{me.data?.email}</Text>
        <Text style={styles.muted}>Timezone: {me.data?.timezone}</Text>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Product promise</Text>
        <Text style={styles.body}>Hearth reflects your effort, joy, rest, and growth. It will not rank you against strangers or decide how you should live.</Text>
      </Card>
      <Pressable onPress={() => Alert.alert('Leave Hearth?', 'You can return whenever you like.', [{ text: 'Stay', style: 'cancel' }, { text: 'Sign out', onPress: logout }])} style={styles.button}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  name: { color: colors.text, fontSize: 24, fontWeight: '700' },
  muted: { color: colors.textMuted },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { color: colors.text, lineHeight: 23 },
  button: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  buttonText: { color: colors.textMuted, fontWeight: '700' },
});
