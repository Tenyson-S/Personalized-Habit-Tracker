import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { colors, spacing } from '../../theme/tokens';

type Period = 'daily' | 'weekly' | 'monthly';
type Metrics = { habit_completion_rate: number | null; tasks_completed: number; average_sleep_minutes: number | null };
type Celebration = {
  kind: 'MOMENTUM' | 'ENJOYMENT' | 'MEMORY';
  title: string;
  message: string;
  suggestions: { name: string; prompt: string }[];
};
type Journey = {
  period: Period;
  current: Metrics;
  previous: Metrics;
  comparison: Record<string, number | null>;
  reflection: string;
  celebration: Celebration;
};

function sleepText(minutes: number | null) {
  if (minutes == null) return '—';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function celebrationIcon(kind: Celebration['kind']) {
  if (kind === 'MEMORY') return '🌄';
  if (kind === 'ENJOYMENT') return '🌿';
  return '🔥';
}

export function JourneyScreen() {
  const [period, setPeriod] = useState<Period>('weekly');
  const journey = useQuery({
    queryKey: ['journey', period],
    queryFn: async () => (await api.get<Journey>(`/journey/${period}/`)).data,
  });

  return (
    <Screen>
      <Text style={styles.eyebrow}>YOUR JOURNEY</Text>
      <Text style={styles.title}>Only you, compared with you.</Text>
      <View style={styles.tabs}>
        {(['daily', 'weekly', 'monthly'] as Period[]).map((item) => (
          <Pressable key={item} onPress={() => setPeriod(item)} style={[styles.tab, period === item && styles.tabActive]}>
            <Text style={period === item ? styles.tabTextActive : styles.tabText}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {journey.isLoading || !journey.data ? <ActivityIndicator /> : (
        <>
          <View style={styles.metricsRow}>
            <Card>
              <Text style={styles.metricLabel}>Habits</Text>
              <Text style={styles.metricCompact}>{journey.data.current.habit_completion_rate ?? 0}%</Text>
              <Text style={styles.mutedSmall}>was {journey.data.previous.habit_completion_rate ?? 0}%</Text>
            </Card>
            <Card>
              <Text style={styles.metricLabel}>Tasks</Text>
              <Text style={styles.metricCompact}>{journey.data.current.tasks_completed}</Text>
              <Text style={styles.mutedSmall}>was {journey.data.previous.tasks_completed}</Text>
            </Card>
            <Card>
              <Text style={styles.metricLabel}>Sleep</Text>
              <Text style={styles.metricSmall}>{sleepText(journey.data.current.average_sleep_minutes)}</Text>
              <Text style={styles.mutedSmall}>was {sleepText(journey.data.previous.average_sleep_minutes)}</Text>
            </Card>
          </View>

          <Card>
            <Text style={styles.sectionTitle}>Reflection</Text>
            <Text style={styles.reflection}>{journey.data.reflection}</Text>
          </Card>

          <Card>
            <Text style={styles.celebrationIcon}>{celebrationIcon(journey.data.celebration.kind)}</Text>
            <Text style={styles.celebrationTitle}>{journey.data.celebration.title}</Text>
            <Text style={styles.reflection}>{journey.data.celebration.message}</Text>
            {journey.data.celebration.suggestions.length > 0 && (
              <View style={styles.suggestionList}>
                <Text style={styles.suggestionHeading}>Things you said you enjoy</Text>
                {journey.data.celebration.suggestions.map((suggestion) => (
                  <View key={suggestion.name} style={styles.suggestionItem}>
                    <Text style={styles.suggestionName}>{suggestion.name}</Text>
                    <Text style={styles.muted}>{suggestion.prompt}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Text style={styles.footerNote}>A reflection, not an instruction.</Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  tabText: { color: colors.textMuted, textTransform: 'capitalize' },
  tabTextActive: { color: colors.text, fontWeight: '700', textTransform: 'capitalize' },
  metricsRow: { flexDirection: 'row', gap: spacing.sm },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  metricCompact: { color: colors.text, fontSize: 24, fontWeight: '800' },
  metricSmall: { color: colors.text, fontSize: 16, fontWeight: '800' },
  mutedSmall: { color: colors.textMuted, fontSize: 10 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  muted: { color: colors.textMuted, lineHeight: 20 },
  reflection: { color: colors.text, fontSize: 17, lineHeight: 25 },
  celebrationIcon: { fontSize: 34 },
  celebrationTitle: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: '800' },
  suggestionList: { gap: spacing.sm, marginTop: spacing.xs },
  suggestionHeading: { color: colors.primary, fontWeight: '700', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
  suggestionItem: { backgroundColor: colors.background, borderRadius: 14, padding: spacing.md, gap: 4 },
  suggestionName: { color: colors.text, fontWeight: '800', fontSize: 16 },
  footerNote: { color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: spacing.xs },
});
