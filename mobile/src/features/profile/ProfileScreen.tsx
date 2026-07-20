import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ScrollView, Modal } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import type { User } from '../../types/api';
import type { ProfileStackParamList } from './ProfileNavigator';
import { GuideScreen } from '../guide/GuideScreen';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHub'>;

function SettingsRow({ title, onPress, destructive, styles, colors }: { title: string; onPress: () => void; destructive?: boolean; styles: any; colors: ThemeColors }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={[styles.rowTitle, destructive && { color: colors.danger }]}>{title}</Text>
      <Text style={styles.chevron}>→</Text>
    </Pressable>
  );
}

export function ProfileScreen() {
  const { colors } = useTheme();
  const { isTablet, isDesktop } = useResponsive();
  const styles = useStyles(colors, isDesktop, isTablet);
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationProp>();
  const signOut = useAuthStore((state) => state.signOut);
  const me = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get<User>('/me/')).data });
  const [showGuide, setShowGuide] = useState(false);

  async function logout() {
    try {
      const refresh = useAuthStore.getState().tokens?.refresh;
      if (refresh) await api.post('/auth/logout/', { refresh });
    } catch {
      // Local sign-out proceeds
    }
    await signOut();
    queryClient.clear();
  }

  async function confirmDelete() {
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your profile, habits, tasks, and history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: () => {} },
      ]
    );
  }

  const profileHeader = (
    <View style={styles.header}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{me.data?.display_name?.slice(0, 2).toUpperCase() || 'ME'}</Text>
      </View>
      <Text style={styles.name}>{me.data?.display_name || 'Stealth Track user'}</Text>
      <Text style={styles.occupation}>{me.data?.profile?.occupation || 'No occupation set'}</Text>
      <Text style={styles.email}>{me.data?.email}</Text>
      <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </Pressable>
    </View>
  );

  const settingsSections = (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PERSONALIZATION</Text>
        <View style={styles.card}>
          <SettingsRow title="Life areas & interests" onPress={() => navigation.navigate('EditInterests')} styles={styles} colors={colors} />
          <SettingsRow title="Sleep schedule" onPress={() => navigation.navigate('EditProfile')} styles={styles} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingsRow title="Notifications & Appearance" onPress={() => navigation.navigate('Settings')} styles={styles} colors={colors} />
          <SettingsRow title="App guide" onPress={() => setShowGuide(true)} styles={styles} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SECURITY</Text>
        <View style={styles.card}>
          <SettingsRow title="Change password" onPress={() => navigation.navigate('ChangePassword')} styles={styles} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.card}>
          <SettingsRow title="Sign out" onPress={() => Alert.alert('Sign out?', 'You can return whenever you like.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', onPress: logout }])} styles={styles} colors={colors} />
        </View>
      </View>
    </>
  );

  return (
    <Screen contentStyle={styles.scroll}>
      {(isTablet || isDesktop) ? (
        <View style={styles.twoCol}>
          <View style={styles.leftCol}>{profileHeader}</View>
          <View style={styles.rightCol}>{settingsSections}</View>
        </View>
      ) : (
        <>
          {profileHeader}
          {settingsSections}
        </>
      )}
      <Modal visible={showGuide} animationType="slide" presentationStyle="pageSheet">
        <GuideScreen onComplete={() => setShowGuide(false)} />
      </Modal>
    </Screen>
  );
}

const useStyles = (colors: ThemeColors, isDesktop = false, isTablet = false) => StyleSheet.create({
  scroll: { padding: isDesktop ? spacing.xl : spacing.lg, paddingBottom: 100 },
  // Two-column layout for tablet/desktop
  twoCol: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  leftCol: { width: isDesktop ? 260 : 220 },
  rightCol: { flex: 1 },
  header: { alignItems: 'center', marginBottom: spacing.xl, marginTop: isDesktop ? 0 : spacing.xl },
  avatar: { width: isDesktop ? 96 : 80, height: isDesktop ? 96 : 80, borderRadius: isDesktop ? 48 : 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: isDesktop ? 32 : 28, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  name: { color: colors.text, fontSize: isDesktop ? 26 : 24, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  occupation: { color: colors.textPrimary, fontSize: 16, marginBottom: 2, textAlign: 'center' },
  email: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg, textAlign: 'center' },
  editButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.xl, paddingVertical: 10, borderRadius: 99 },
  editButtonText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  section: { marginBottom: spacing.xl },
  sectionHeader: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm, marginLeft: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '500' },
  chevron: { color: colors.textMuted, fontSize: 18 },
});
