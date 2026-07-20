import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import axios from 'axios';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

export function AuthScreen() {
  const { colors } = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const styles = useStyles(colors, isDesktop);
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
          const data = error.response.data;
          if (mode === 'login' && error.response.status === 401) {
            message = 'Incorrect email or password.';
          } else if (mode === 'register' && data?.email) {
            message = 'This email is already in use. Please use a different one or sign in.';
          } else {
            message = data?.detail ?? data?.email?.[0] ?? data?.password?.[0] ?? JSON.stringify(data);
          }
        } else if (error.request) {
          message = `Network error: Cannot connect to ${error.config?.baseURL}. Make sure your phone and computer are on the same Wi-Fi.`;
        }
      }
      Alert.alert('Could not continue', message);
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <View style={styles.formCard}>
      <Text style={styles.eyebrow}>STEALTH TRACK</Text>
      <Text style={styles.title}>
        {isDesktop ? 'Build your life.\nKeep returning.' : 'Build your life. Keep returning.'}
      </Text>
      <Text style={styles.subtitle}>A quiet place to reflect on the life you are already building.</Text>

      <View style={styles.form}>
        {mode === 'register' && (
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="What should Stealth Track call you?"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        )}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={styles.input}
        />
        <Pressable onPress={submit} disabled={loading} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'One moment…' : mode === 'login' ? 'Enter Stealth Track' : 'Begin quietly'}
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={() => {
        setMode(mode === 'login' ? 'register' : 'login');
        setEmail('');
        setPassword('');
        setDisplayName('');
      }}>
        <Text style={styles.switchText}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </Text>
      </Pressable>
    </View>
  );

  // ─── Desktop: Two-column hero + form ──────────────────────────────────────
  if (isDesktop) {
    return (
      <View style={[styles.desktopRoot, { backgroundColor: colors.background }]}>
        {/* Left: branding hero */}
        <View style={[styles.desktopHero, { backgroundColor: colors.primarySoft }]}>
          <View style={styles.desktopHeroInner}>
            <Text style={[styles.heroLogo, { color: colors.primary }]}>STEALTH TRACK</Text>
            <Text style={[styles.heroHeadline, { color: colors.text }]}>
              {"Build your life.\nKeep returning."}
            </Text>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              A quiet place to reflect on the life you are already building. No comparison. No feed. Just you.
            </Text>
            <View style={styles.heroFeatures}>
              {['Track habits quietly', 'Watch your village grow', 'Reflect on your journey'].map((f) => (
                <View key={f} style={styles.heroFeatureRow}>
                  <View style={[styles.heroFeatureDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.heroFeatureText, { color: colors.textSecondary }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        {/* Right: auth form */}
        <ScrollView
          contentContainerStyle={styles.desktopFormScroll}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          {formContent}
        </ScrollView>
      </View>
    );
  }

  // ─── Mobile / Tablet: centered card ───────────────────────────────────────
  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollRoot,
        { backgroundColor: colors.background },
        isTablet && styles.tabletScrollRoot,
      ]}
    >
      {formContent}
    </ScrollView>
  );
}

const useStyles = (colors: ThemeColors, isDesktop: boolean) => StyleSheet.create({
  // Shared form card
  formCard: {
    width: '100%',
    maxWidth: isDesktop ? 420 : 480,
    alignSelf: 'center',
    gap: spacing.md,
  },
  eyebrow: { color: colors.primary, fontWeight: '700', letterSpacing: 2, fontSize: 11 },
  title: { color: colors.text, fontSize: isDesktop ? 40 : 34, lineHeight: isDesktop ? 46 : 40, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  form: { gap: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  switchText: { color: colors.primary, textAlign: 'center', padding: spacing.sm },

  // Mobile / Tablet scroll
  scrollRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: '100%',
  },
  tabletScrollRoot: {
    paddingHorizontal: 60,
    paddingVertical: 80,
  },

  // Desktop two-column
  desktopRoot: { flex: 1, flexDirection: 'row' },
  desktopHero: {
    flex: 1,
    justifyContent: 'center',
    padding: 60,
  },
  desktopHeroInner: { maxWidth: 480, gap: 24 },
  heroLogo: { fontSize: 11, fontWeight: '900', letterSpacing: 3 },
  heroHeadline: { fontSize: 52, lineHeight: 58, fontWeight: '800', letterSpacing: -1.5 },
  heroSub: { fontSize: 17, lineHeight: 27 },
  heroFeatures: { gap: 12, marginTop: 8 },
  heroFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroFeatureDot: { width: 8, height: 8, borderRadius: 99 },
  heroFeatureText: { fontSize: 15, fontWeight: '500' },
  desktopFormScroll: {
    flex: 1,
    justifyContent: 'center',
    padding: 60,
    minHeight: '100%',
  },
});
