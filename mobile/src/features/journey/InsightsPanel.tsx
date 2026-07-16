import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import type {
  AnalyticsOverview,
  AnalyticsPeriod,
  AnalyticsRecords,
  AnalyticsRhythm,
  TaskAnalytics,
} from '../../types/api';

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '1y', label: '1 year' },
];

function sleepText(minutes: number | null) {
  if (minutes == null) return 'No record';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatPeriod(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const startText = startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' });
  const endText = endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startText} – ${endText}`;
}

export function InsightsPanel() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const overview = useQuery({
    queryKey: ['analytics-overview', period],
    queryFn: async () => (await api.get<AnalyticsOverview>(`/analytics/overview/?period=${period}`)).data,
  });
  const rhythm = useQuery({
    queryKey: ['analytics-rhythm', period],
    queryFn: async () => (await api.get<AnalyticsRhythm>(`/analytics/rhythm/?period=${period}`)).data,
  });
  const tasks = useQuery({
    queryKey: ['analytics-tasks', period],
    queryFn: async () => (await api.get<TaskAnalytics>(`/analytics/tasks/?period=${period}`)).data,
  });
  const records = useQuery({
    queryKey: ['analytics-records'],
    queryFn: async () => (await api.get<AnalyticsRecords>('/analytics/records/')).data,
  });

  if (overview.isLoading || rhythm.isLoading || tasks.isLoading || records.isLoading) {
    return <ActivityIndicator />;
  }

  if (!overview.data || !rhythm.data || !tasks.data || !records.data) {
    return <Card><Text style={styles.muted}>Insights could not be loaded right now.</Text></Card>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.kicker}>PERSONAL PATTERNS</Text>
        <Text style={styles.introTitle}>See what has been becoming visible.</Text>
        <Text style={styles.introBody}>Facts first. Gentle observations second. No score is deciding whether this was a good life.</Text>
      </View>

      <View style={styles.periodRow}>
        {PERIODS.map((item) => (
          <Pressable key={item.key} onPress={() => setPeriod(item.key)} style={[styles.periodChip, period === item.key && styles.periodChipActive]}>
            <Text style={period === item.key ? styles.periodTextActive : styles.periodText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.rangeText}>{formatPeriod(overview.data.range.start, overview.data.range.end)}</Text>

      <SummaryGrid data={overview.data} styles={styles} />

      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>WHAT STOOD OUT</Text>
        <Text style={styles.sectionTitle}>A few things worth noticing</Text>
      </View>
      {overview.data.insights.map((insight, index) => (
        <View key={`${insight.kind}-${index}`} style={styles.insightCard}>
          <Text style={styles.insightKind}>{insight.kind.replaceAll('_', ' ')}</Text>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightBody}>{insight.message}</Text>
        </View>
      ))}

      <LifeAreaSection overview={overview.data} styles={styles} />
      <RhythmSection data={rhythm.data} styles={styles} />
      <TaskTimingSection data={tasks.data} styles={styles} />
      <RecordsSection data={records.data} styles={styles} />

      <Text style={styles.footerNote}>A pattern can be useful without becoming a command.</Text>
    </View>
  );
}

function SummaryGrid({ data, styles }: { data: AnalyticsOverview; styles: any }) {
  const metrics = [
    { label: 'Active days', value: `${data.current.active_days}`, detail: `of ${data.range.days}` },
    { label: 'Habits', value: `${data.current.habit_completions}`, detail: 'completed' },
    { label: 'Dailies', value: `${data.current.daily_completions}`, detail: 'completed' },
    { label: 'Tasks', value: `${data.current.tasks_completed}`, detail: 'completed' },
    { label: 'Sleep', value: sleepText(data.current.average_sleep_minutes), detail: 'average record' },
    { label: 'Memories', value: `${data.current.memories_kept}`, detail: 'kept by you' },
  ];
  return (
    <View style={styles.summaryGrid}>
      {metrics.map((metric) => (
        <View key={metric.label} style={styles.summaryCard}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={styles.metricValue}>{metric.value}</Text>
          <Text style={styles.metricDetail}>{metric.detail}</Text>
        </View>
      ))}
    </View>
  );
}

function LifeAreaSection({ overview, styles }: { overview: AnalyticsOverview; styles: any }) {
  const visible = overview.life_areas.filter((item) => item.total_actions > 0);
  const rows = visible.length > 0 ? visible : overview.life_areas.slice(0, 4);
  const max = Math.max(1, ...rows.map((item) => item.total_actions));

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>LIFE AREAS</Text>
        <Text style={styles.sectionTitle}>Where activity appeared</Text>
      </View>
      <Card>
        {rows.map((item) => (
          <View key={item.key} style={styles.areaRow}>
            <View style={styles.areaTopline}>
              <Text style={styles.areaLabel}>{item.label}</Text>
              <Text style={styles.areaCount}>{item.total_actions}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.max(4, Math.round(item.total_actions / max * 100))}%` }]} />
            </View>
            <Text style={styles.areaMeta}>{item.active_days} active day{item.active_days === 1 ? '' : 's'} · {item.share_percent}% of visible activity</Text>
          </View>
        ))}
        {visible.length === 0 ? <Text style={styles.muted}>No life area needs to be filled in. The map will appear as real activity is recorded.</Text> : null}
      </Card>
    </>
  );
}

function RhythmSection({ data, styles }: { data: AnalyticsRhythm; styles: any }) {
  const visibleAreas = data.areas.filter((area) => area.total > 0).slice(0, 6);
  const maxCell = Math.max(1, ...visibleAreas.flatMap((area) => area.counts));
  const strongestTime = useMemo(
    () => [...data.time_buckets].sort((a, b) => b.count - a.count)[0],
    [data.time_buckets],
  );

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>RHYTHM</Text>
        <Text style={styles.sectionTitle}>When life tends to happen</Text>
      </View>
      <Card>
        <View style={styles.weekHeader}>
          <Text style={styles.rhythmLabelSpacer}>Area</Text>
          {data.weekdays.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
        </View>
        {visibleAreas.length === 0 ? <Text style={styles.muted}>There is not enough activity yet to reveal a weekly rhythm.</Text> : visibleAreas.map((area) => (
          <View key={area.key} style={styles.rhythmRow}>
            <Text numberOfLines={1} style={styles.rhythmAreaLabel}>{shortArea(area.label)}</Text>
            {area.counts.map((count, index) => (
              <View key={`${area.key}-${index}`} style={[styles.rhythmCell, count > 0 && { opacity: 0.28 + (count / maxCell) * 0.72 }]}>
                <Text style={styles.rhythmCellText}>{count || ''}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={styles.divider} />
        <Text style={styles.reflection}>{data.reflection}</Text>
        {strongestTime?.count > 0 ? (
          <Text style={styles.mutedSmall}>{strongestTime.label}: {strongestTime.count} timed actions{strongestTime.top_area_label ? ` · mostly ${strongestTime.top_area_label}` : ''}</Text>
        ) : null}
      </Card>
    </>
  );
}

function TaskTimingSection({ data, styles }: { data: TaskAnalytics; styles: any }) {
  const deadline = data.current.deadline_behavior;
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>TASK TIMING</Text>
        <Text style={styles.sectionTitle}>How completed work met its deadlines</Text>
      </View>
      <Card>
        <View style={styles.deadlineRow}>
          <DeadlineMetric label="Early" value={deadline.early} styles={styles} />
          <DeadlineMetric label="Near due" value={deadline.on_time} styles={styles} />
          <DeadlineMetric label="Late" value={deadline.late} styles={styles} />
        </View>
        <Text style={styles.reflection}>{data.current.reflection}</Text>
        <Text style={styles.mutedSmall}>{data.current.completed} tasks completed · {data.current.open_now} currently open</Text>
      </Card>
    </>
  );
}

function DeadlineMetric({ label, value, styles }: { label: string; value: number; styles: any }) {
  return (
    <View style={styles.deadlineMetric}>
      <Text style={styles.deadlineValue}>{value}</Text>
      <Text style={styles.deadlineLabel}>{label}</Text>
    </View>
  );
}

function RecordsSection({ data, styles }: { data: AnalyticsRecords; styles: any }) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>THINGS THAT BECAME VISIBLE</Text>
        <Text style={styles.sectionTitle}>Personal records without a leaderboard</Text>
      </View>
      <Card>
        {data.records.length === 0 ? <Text style={styles.muted}>Longer-term patterns will appear here as more history becomes available.</Text> : data.records.map((record) => (
          <View key={record.key} style={styles.recordRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.recordTitle}>{record.title}</Text>
              <Text style={styles.recordDetail}>{record.detail}</Text>
            </View>
            <View style={styles.recordValueWrap}>
              <Text style={styles.recordValue}>{record.value}</Text>
              <Text style={styles.recordUnit}>{record.unit}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.principle}>{data.principle}</Text>
      </Card>
    </>
  );
}

function shortArea(label: string) {
  return label
    .replace(' & Identity', '')
    .replace(' & Connection', '')
    .replace(' & Craft', '')
    .replace(' & Nourishment', '')
    .replace(' & Inner Calm', '')
    .replace(' & Personal Stability', '')
    .replace(' & Knowledge', '')
    .replace(' & Long-Term Direction', '')
    .replace('Everything Else That Keeps Life Moving', 'Life Admin');
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: spacing.md },
  intro: { gap: 6, paddingVertical: 4 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  introTitle: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '800', letterSpacing: -0.4 },
  introBody: { color: colors.textMuted, lineHeight: 21 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  periodChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.surface },
  periodChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  periodText: { color: colors.textMuted, fontSize: 12 },
  periodTextActive: { color: colors.text, fontSize: 12, fontWeight: '800' },
  rangeText: { color: colors.textMuted, fontSize: 11 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { width: '48%', minHeight: 102, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 },
  metricLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  metricValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  metricDetail: { color: colors.textMuted, fontSize: 11 },
  sectionHeader: { gap: 4, paddingTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 21, lineHeight: 26, fontWeight: '800' },
  insightCard: { borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, gap: 5 },
  insightKind: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  insightTitle: { color: colors.text, fontSize: 17, fontWeight: '800', lineHeight: 22 },
  insightBody: { color: colors.textMuted, lineHeight: 20 },
  areaRow: { gap: 7, paddingVertical: 5 },
  areaTopline: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  areaLabel: { flex: 1, color: colors.text, fontWeight: '700' },
  areaCount: { color: colors.primary, fontWeight: '800' },
  areaMeta: { color: colors.textMuted, fontSize: 10 },
  barTrack: { height: 7, borderRadius: 99, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99, backgroundColor: colors.primary },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rhythmLabelSpacer: { width: 82, color: colors.textMuted, fontSize: 9 },
  weekday: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  rhythmRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rhythmAreaLabel: { width: 82, color: colors.text, fontSize: 10, fontWeight: '700' },
  rhythmCell: { flex: 1, aspectRatio: 1, maxHeight: 29, borderRadius: 7, backgroundColor: colors.primary, opacity: 0.08, alignItems: 'center', justifyContent: 'center' },
  rhythmCellText: { color: colors.text, fontSize: 8, fontWeight: '800' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
  reflection: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.textMuted, lineHeight: 21 },
  mutedSmall: { color: colors.textMuted, fontSize: 10, lineHeight: 16 },
  deadlineRow: { flexDirection: 'row', gap: 8 },
  deadlineMetric: { flex: 1, alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, paddingVertical: 13, gap: 3 },
  deadlineValue: { color: colors.text, fontSize: 23, fontWeight: '800' },
  deadlineLabel: { color: colors.textMuted, fontSize: 10 },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  recordTitle: { color: colors.text, fontWeight: '800' },
  recordDetail: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  recordValueWrap: { alignItems: 'flex-end' },
  recordValue: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  recordUnit: { color: colors.textMuted, fontSize: 9 },
  principle: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic', lineHeight: 17, paddingTop: 6 },
  footerNote: { color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
});
