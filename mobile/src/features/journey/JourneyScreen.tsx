import React, { useState } from 'react';

import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { StoryPanel } from './StoryPanel';
import { InsightsPanel } from './InsightsPanel';

type Period = 'daily' | 'weekly' | 'monthly' | 'insights' | 'story';
type ReflectionPeriod = Exclude<Period, 'story' | 'insights'>;
type Metrics = { habit_completion_rate: number | null; tasks_completed: number; average_sleep_minutes: number | null };
type Celebration = {
  kind: 'MOMENTUM' | 'ENJOYMENT' | 'MEMORY';
  title: string;
  message: string;
  suggestions: { name: string; prompt: string }[];
};
type Journey = {
  period: ReflectionPeriod;
  current: Metrics;
  previous: Metrics;
  comparison: Record<string, number | null>;
  reflection: string;
  celebration: Celebration;
};

function sleepText(minutes: number | null) {
  if (minutes == null) return 'No record';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function celebrationMark(kind: Celebration['kind']) {
  if (kind === 'MEMORY') return 'MEMORY';
  if (kind === 'ENJOYMENT') return 'ENJOYMENT';
  return 'MOMENTUM';
}

export function JourneyScreen() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const [period, setPeriod] = useState<Period>('weekly');
  const journey = useQuery({
    queryKey: ['journey', period],
    queryFn: async () => (await api.get<Journey>(`/journey/${period}/`)).data,
    enabled: period !== 'story' && period !== 'insights',
  });

  return (
    <Screen>
      <Text style={styles.eyebrow}>YOUR JOURNEY</Text>
      <Text style={styles.title}>Only you,{`\n`}compared with you.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {(['daily', 'weekly', 'monthly', 'insights', 'story'] as Period[]).map((item) => (
          <Pressable key={item} onPress={() => setPeriod(item)} style={[styles.tab, period === item && styles.tabActive]}>
            <Text style={period === item ? styles.tabTextActive : styles.tabText}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {period === 'story' ? <StoryPanel /> : period === 'insights' ? <InsightsPanel /> : journey.isLoading || !journey.data ? <ActivityIndicator /> : (
        <>
          <View style={styles.metricsRow}>
            <Card>
              <Text style={styles.metricLabel}>Habits</Text>
              <Text style={styles.metricCompact}>{journey.data.current.habit_completion_rate ?? '—'}{journey.data.current.habit_completion_rate == null ? '' : '%'}</Text>
              <Text style={styles.mutedSmall}>was {journey.data.previous.habit_completion_rate ?? '—'}{journey.data.previous.habit_completion_rate == null ? '' : '%'}</Text>
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
            <Text style={styles.celebrationMark}>{celebrationMark(journey.data.celebration.kind)}</Text>
            <Text style={styles.celebrationTitle}>{journey.data.celebration.title}</Text>
            <Text style={styles.reflection}>{journey.data.celebration.message}</Text>
            {period === 'daily' && journey.data.celebration.suggestions.length > 0 && (
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

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  title: { color: colors.text, fontSize: 34, lineHeight: 38, letterSpacing: -1, fontWeight: '700', marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md, paddingBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 13, textTransform: 'capitalize', fontWeight: '600' },
  tabTextActive: { color: colors.text, fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  metricsRow: { flexDirection: 'row', gap: spacing.sm },
  metricLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  metricCompact: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 4 },
  metricSmall: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  mutedSmall: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  muted: { color: colors.textMuted, lineHeight: 20 },
  reflection: { color: colors.text, fontSize: 16, lineHeight: 24 },
  celebrationMark: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  celebrationTitle: { color: colors.text, fontSize: 22, lineHeight: 28, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
  suggestionList: { gap: spacing.sm, marginTop: spacing.md },
  suggestionHeading: { color: colors.primary, fontWeight: '700', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  suggestionItem: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: spacing.md, gap: 4 },
  suggestionName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  footerNote: { color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: spacing.md, fontSize: 12 },
});
