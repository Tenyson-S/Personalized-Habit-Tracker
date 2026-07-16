import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import type { User } from '../../types/api';

export function ChangePasswordScreen() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const navigation = useNavigation();
  const me = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get<User>('/me/')).data });
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (me.data?.auth_provider === 'GOOGLE') {
    return (
      <Screen contentStyle={styles.scroll}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.body}>Your account uses Google Sign-In. You do not have a local password to change.</Text>
      </Screen>
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setError('');
    try {
      await api.post('/me/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      Alert.alert('Success', 'Password successfully updated.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      if (e.response?.data) {
        const errorMsg = typeof e.response.data === 'string' 
          ? e.response.data 
          : Object.values(e.response.data).flat().join('\n');
        setError(errorMsg);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen contentStyle={styles.scroll}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      
      <Text style={styles.title}>Change Password</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Current Password</Text>
        <TextInput 
          style={styles.input} 
          value={currentPassword} 
          onChangeText={setCurrentPassword} 
          secureTextEntry 
          autoCapitalize="none" 
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>New Password</Text>
        <TextInput 
          style={styles.input} 
          value={newPassword} 
          onChangeText={setNewPassword} 
          secureTextEntry 
          autoCapitalize="none" 
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput 
          style={styles.input} 
          value={confirmPassword} 
          onChangeText={setConfirmPassword} 
          secureTextEntry 
          autoCapitalize="none" 
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <Pressable onPress={handleSave} disabled={isSaving || !currentPassword || !newPassword || !confirmPassword} style={[styles.saveButton, (isSaving || !currentPassword || !newPassword || !confirmPassword) && styles.saveButtonDisabled]}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Update Password</Text>}
      </Pressable>
    </Screen>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  scroll: { paddingBottom: 100 },
  backButton: { marginBottom: spacing.lg, paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontWeight: '600', fontSize: 16 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: spacing.xl },
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  errorText: { color: colors.danger, marginBottom: spacing.md, backgroundColor: '#ffe5e5', padding: spacing.md, borderRadius: radius.md },
  formGroup: { marginBottom: spacing.lg },
  label: { color: colors.text, fontWeight: '600', marginBottom: spacing.xs, marginLeft: 4 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: 16 },
  saveButton: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
