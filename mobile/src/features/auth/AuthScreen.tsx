import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import axios from 'axios';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing } from '../../theme/tokens';

export function AuthScreen() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 8) {
      Alert.alert('Check your details', 'Use a valid email and a password with at least 8 characters.');
      return;
    }
    try {
      setLoading(true);
      const endpoint = mode === 'login' ? '/auth/login/' : '/auth/register/';
      const payload = mode === 'login'
        ? { email: email.trim(), password }
        : { email: email.trim(), password, display_name: displayName.trim(), timezone: 'Asia/Kolkata' };
      const { data } = await api.post(endpoint, payload);
      await setTokens(data.tokens);
    } catch (error) {
      let message = 'Could not reach the server. Check your Wi-Fi and API URL.';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with an error (4xx/5xx)
          const data = error.response.data;
          message = data?.detail ?? data?.email?.[0] ?? data?.password?.[0] ?? JSON.stringify(data);
        } else if (error.request) {
          // Request was made but no response (network issue)
          message = `Network error: Cannot connect to ${error.config?.baseURL}. Make sure your phone and computer are on the same Wi-Fi and the API URL in .env is your computer's IP.`;
        }
      }
      Alert.alert('Could not continue', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>PROJECT VILLAGE</Text>
      <Text style={styles.title}>Build your life. Not your screen time.</Text>
      <Text style={styles.subtitle}>A quiet place to reflect on the life you are already building.</Text>

      <View style={styles.form}>
        {mode === 'register' && (
          <TextInput value={displayName} onChangeText={setDisplayName} placeholder="What should Village call you?" style={styles.input} />
        )}
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />
        <Pressable onPress={submit} disabled={loading} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{loading ? 'One moment…' : mode === 'login' ? 'Enter Village' : 'Begin quietly'}</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        <Text style={styles.switchText}>{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  eyebrow: { color: colors.primary, fontWeight: '700', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 34, lineHeight: 40, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  form: { gap: spacing.sm, marginTop: spacing.md },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontWeight: '700' },
  switchText: { color: colors.primary, textAlign: 'center', padding: spacing.sm },
});
