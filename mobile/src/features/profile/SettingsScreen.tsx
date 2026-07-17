import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Switch, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/Screen';
import { useSettingsStore } from '../../store/settingsStore';
import { useThemeStore } from '../../store/themeStore';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import type { UserSettings } from '../../types/api';

export function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const navigation = useNavigation();
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (isLoading && !settings) {
    return <Screen><ActivityIndicator /></Screen>;
  }

  const toggleNotification = (key: keyof UserSettings) => {
    if (settings) updateSettings({ [key]: !settings[key] });
  };

  return (
    <Screen contentStyle={styles.scroll}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      
      <Text style={styles.title}>Preferences</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Theme</Text>
            <View style={styles.segmentedControl}>
              {(['SYSTEM', 'LIGHT', 'DARK'] as const).map(t => (
                <Pressable 
                  key={t} 
                  onPress={() => {
                    setTheme(t);
                    if (settings) updateSettings({ theme: t });
                  }}
                  style={[styles.segment, theme === t && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, theme === t && styles.segmentTextActive]}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.rowTitle}>Reduced Motion</Text>
              <Text style={styles.rowSub}>Minimize animations</Text>
            </View>
            <Switch 
              value={settings?.reduced_motion} 
              onValueChange={() => toggleNotification('reduced_motion')}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Habit Reminders</Text>
            <Switch 
              value={settings?.habit_notifications_enabled} 
              onValueChange={() => toggleNotification('habit_notifications_enabled')}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Daily Activities</Text>
            <Switch 
              value={settings?.daily_notifications_enabled} 
              onValueChange={() => toggleNotification('daily_notifications_enabled')}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowTitle}>One-off Tasks</Text>
            <Switch 
              value={settings?.task_notifications_enabled} 
              onValueChange={() => toggleNotification('task_notifications_enabled')}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>REFLECTIONS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Weekly Reflections</Text>
            <Switch 
              value={settings?.weekly_reflection_enabled} 
              onValueChange={() => toggleNotification('weekly_reflection_enabled')}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowTitle}>Monthly Reflections</Text>
            <Switch 
              value={settings?.monthly_reflection_enabled} 
              onValueChange={() => toggleNotification('monthly_reflection_enabled')}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>
      </View>

    </Screen>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  scroll: { paddingBottom: 100 },
  backButton: { marginBottom: spacing.lg, paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontWeight: '600', fontSize: 16 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: spacing.xl },
  
  section: { marginBottom: spacing.xl },
  sectionHeader: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm, marginLeft: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '500' },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  
  segmentedControl: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 2 },
  segment: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  segmentText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  segmentTextActive: { color: colors.textPrimary },
});
