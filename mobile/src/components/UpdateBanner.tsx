import React, { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Application from 'expo-application';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

type ReleaseInfo = {
  available: boolean;
  version_code: number;
  version_name: string;
  download_url: string | null;
  sha256: string | null;
  required: boolean;
  release_notes: string;
};

export function UpdateBanner() {
  const { colors } = useTheme();
  const [dismissedCode, setDismissedCode] = useState<number | null>(null);
  const release = useQuery({
    queryKey: ['app-version'],
    queryFn: async () => (await api.get<ReleaseInfo>('/app/version/')).data,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  if (Platform.OS !== 'android' || !release.data?.available || !release.data.download_url) return null;

  const installedCode = Number(Application.nativeBuildVersion ?? 0);
  if (release.data.version_code <= installedCode || dismissedCode === release.data.version_code) return null;

  const startUpdate = async () => {
    const url = release.data?.download_url;
    if (url && url.startsWith('https://')) await Linking.openURL(url);
  };

  return (
    <View style={[styles.banner, { backgroundColor: colors.primarySoft, borderColor: colors.border }]} accessibilityLiveRegion="polite">
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>Update {release.data.version_name} available</Text>
        <Text numberOfLines={2} style={[styles.notes, { color: colors.textMuted }]}>{release.data.release_notes}</Text>
      </View>
      {!release.data.required && (
        <Pressable onPress={() => setDismissedCode(release.data!.version_code)} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.later, { color: colors.textMuted }]}>Later</Text>
        </Pressable>
      )}
      <Pressable onPress={startUpdate} style={[styles.button, { backgroundColor: colors.primary }]} accessibilityRole="button">
        <Text style={[styles.buttonText, { color: colors.background }]}>Update</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderBottomWidth: 1, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  copy: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800' },
  notes: { fontSize: 11, marginTop: 2 },
  later: { fontSize: 12, fontWeight: '700', paddingVertical: 8 },
  button: { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9 },
  buttonText: { fontSize: 12, fontWeight: '800' },
});
