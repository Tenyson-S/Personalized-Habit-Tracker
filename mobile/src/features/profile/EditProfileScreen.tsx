import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { TimePickerField } from '../../components/forms/TimePickerField';
import { api } from '../../services/api';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import type { User } from '../../types/api';

export function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const me = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get<User>('/me/')).data });
  
  const [displayName, setDisplayName] = useState(me.data?.display_name || '');
  const [occupation, setOccupation] = useState(me.data?.profile?.occupation || '');
  const [timezone, setTimezone] = useState(me.data?.timezone || '');
  const [sleepTarget, setSleepTarget] = useState(me.data?.profile?.target_sleep_time || '');
  const [wakeTarget, setWakeTarget] = useState(me.data?.profile?.target_wake_time || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setIsSaving(true);
    setError('');
    try {
      await api.patch('/me/', {
        display_name: displayName.trim(),
        timezone: timezone.trim() || 'UTC',
        profile: {
          occupation: occupation.trim(),
          target_sleep_time: sleepTarget || null,
          target_wake_time: wakeTarget || null,
        }
      });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigation.goBack();
    } catch (e: any) {
      if (e.response?.data) {
        const errorMsg = typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data);
        setError(errorMsg);
      } else {
        setError('An unexpected error occurred while saving.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (me.isLoading) return <Screen><ActivityIndicator /></Screen>;

  return (
    <Screen contentStyle={styles.scroll}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      
      <Text style={styles.title}>Edit Profile</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email (Read-only)</Text>
        <TextInput style={[styles.input, styles.inputDisabled]} value={me.data?.email} editable={false} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor={colors.textMuted} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Occupation</Text>
        <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="e.g. AI/ML Engineering Student" placeholderTextColor={colors.textMuted} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Timezone (IANA format)</Text>
        <TextInput style={styles.input} value={timezone} onChangeText={setTimezone} placeholder="e.g. Asia/Kolkata" placeholderTextColor={colors.textMuted} />
      </View>

      <View style={{ height: spacing.md }} />
      
      <TimePickerField label="Preferred sleep time" value={sleepTarget} onChange={setSleepTarget} allowClear />
      <TimePickerField label="Preferred wake time" value={wakeTarget} onChange={setWakeTarget} allowClear />

      <Pressable onPress={handleSave} disabled={isSaving} style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
      </Pressable>
    </Screen>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  scroll: { paddingBottom: 100 },
  backButton: { marginBottom: spacing.lg, paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontWeight: '600', fontSize: 16 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: spacing.xl },
  errorText: { color: colors.danger, marginBottom: spacing.md, backgroundColor: '#ffe5e5', padding: spacing.md, borderRadius: radius.md },
  formGroup: { marginBottom: spacing.lg },
  label: { color: colors.text, fontWeight: '600', marginBottom: spacing.xs, marginLeft: 4 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: 16 },
  inputDisabled: { backgroundColor: colors.surfaceMuted, color: colors.textMuted },
  saveButton: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
