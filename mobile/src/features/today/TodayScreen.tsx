import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { ActivityManager } from './ActivityManager';
import { HabitDashboard } from './HabitDashboard';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useComposerStore } from '../../store/composerStore';
import type { Chapter, HabitDashboard as HabitDashboardPayload, TodayPayload, User } from '../../types/api';

function formatMinutes(value?: number | null) {
  if (value == null) return 'No sleep record';
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h ${minutes}m`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function TodayScreen() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const queryClient = useQueryClient();
  const [manageOpen, setManageOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const today = useQuery({ queryKey: ['today'], queryFn: async () => (await api.get<TodayPayload>('/today/')).data });
  const me = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get<User>('/me/')).data });
  const habitDashboard = useQuery({ queryKey: ['habit-dashboard'], queryFn: async () => (await api.get<HabitDashboardPayload>('/habits/dashboard/')).data });
  const sleepCurrent = useQuery({ queryKey: ['sleep-current'], queryFn: async () => (await api.get('/sleep/current/')).data });
  const currentChapter = useQuery({ queryKey: ['chapter-current'], queryFn: async () => (await api.get<Chapter | null>('/chapters/current/')).data });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['today'] }),
      queryClient.invalidateQueries({ queryKey: ['village'] }),
      queryClient.invalidateQueries({ queryKey: ['habit-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] }),
    ]);
  };

  const completeHabit = useMutation({
    mutationFn: async ({ id, date, completed }: { id: string; date: string; completed: boolean }) => api.put(`/habits/${id}/completion/${date}/`, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['today'] });
      const previous = queryClient.getQueryData<TodayPayload>(['today']);
      if (previous) {
        queryClient.setQueryData<TodayPayload>(['today'], {
          ...previous,
          habits: previous.habits.map(h => h.id === id ? { ...h, completion: { completed, value: h.completion?.value ?? 0 } } : h)
        });
      }
      return { previous };
    },
    onError: (_err, _newVal, context) => {
      if (context?.previous) queryClient.setQueryData(['today'], context.previous);
    },
    onSettled: () => refresh(),
  });
  const completeDaily = useMutation({
    mutationFn: async ({ id, date, completed }: { id: string; date: string; completed: boolean }) => api.put(`/dailies/${id}/completion/${date}/`, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['today'] });
      const previous = queryClient.getQueryData<TodayPayload>(['today']);
      if (previous) {
        queryClient.setQueryData<TodayPayload>(['today'], {
          ...previous,
          dailies: previous.dailies.map(d => d.id === id ? { ...d, completion: { completed } } : d)
        });
      }
      return { previous };
    },
    onError: (_err, _newVal, context) => {
      if (context?.previous) queryClient.setQueryData(['today'], context.previous);
    },
    onSettled: () => refresh(),
  });
  const completeTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => api.post(`/tasks/${id}/complete/`, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['today'] });
      const previous = queryClient.getQueryData<TodayPayload>(['today']);
      if (previous) {
        queryClient.setQueryData<TodayPayload>(['today'], {
          ...previous,
          tasks: previous.tasks.map(t => t.id === id ? { ...t, completed } : t)
        });
      }
      return { previous };
    },
    onError: (_err, _newVal, context) => {
      if (context?.previous) queryClient.setQueryData(['today'], context.previous);
    },
    onSettled: () => refresh(),
  });
  const sleep = useMutation({
    mutationFn: async () => sleepCurrent.data ? api.post('/sleep/wake/', {}) : api.post('/sleep/start/', {}),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sleep-current'] }),
        queryClient.invalidateQueries({ queryKey: ['today'] }),
        queryClient.invalidateQueries({ queryKey: ['village'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics-overview'] }),
      ]);
    },
  });

  const focusHabit = useMemo(() => {
    const items = habitDashboard.data?.habits ?? [];
    return items.find((habit) => habit.foundation.required && !habit.foundation.established)
      ?? items.find((habit) => habit.status === 'ACTIVE')
      ?? null;
  }, [habitDashboard.data]);

  if (today.isLoading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!today.data) return <View style={styles.center}><Text>Could not load today.</Text></View>;
  const data = today.data;
  const firstName = (me.data?.display_name || 'there').split(' ')[0];

  return (
    <>
      <Screen contentStyle={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
        </View>
        <View style={styles.rule} />

        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroKicker}>Track</Text>
            <Text style={styles.heroTitle}>what keeps{`\n`}returning</Text>
          </View>
          <View style={styles.dayProgress}>
            <Text style={styles.dayProgressValue}>{data.progress_percent}%</Text>
            <Text style={styles.dayProgressLabel}>Today</Text>
          </View>
        </View>

        <View style={styles.quickGrid}>
          <View style={[styles.quickTile, styles.blackTile]}>
            <Text style={styles.quickLabelLight}>Persistence</Text>
            <Text style={styles.quickValueLight}>{habitDashboard.data?.summary.strongest_persistence_weeks ?? 0}</Text>
            <Text style={styles.quickUnitLight}>Weeks</Text>
          </View>
          <View style={[styles.quickTile, styles.butterTile]}>
            <Text style={styles.quickLabel}>Consistency</Text>
            <Text style={styles.quickValue}>{Math.round(habitDashboard.data?.summary.average_consistency ?? 0)}%</Text>
            <Text style={styles.quickUnit}>30-day average</Text>
          </View>
        </View>

        {focusHabit ? (
          <Pressable onPress={() => setDashboardOpen(true)} style={styles.focusHabitCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.focusHabitName}>{focusHabit.name}</Text>
                <Text style={styles.focusHabitSchedule}>{focusHabit.schedule_label}</Text>
              </View>
              <Text style={styles.arrow}>↗</Text>
            </View>
            {focusHabit.foundation.required && !focusHabit.foundation.established ? (
              <>
                <Text style={styles.focusNumber}>{focusHabit.foundation.progress} / 21</Text>
                <Text style={styles.focusCaption}>foundation check-ins</Text>
                <View style={styles.track}><View style={[styles.fill, { width: `${focusHabit.foundation.percent}%` }]} /></View>
              </>
            ) : (
              <View style={styles.focusStats}>
                <View><Text style={styles.focusNumber}>{focusHabit.metrics.persistence_streak_weeks}</Text><Text style={styles.focusCaption}>weeks persistent</Text></View>
                <View style={styles.focusSide}><Text style={styles.focusSideValue}>{Math.round(focusHabit.metrics.consistency_30_days)}%</Text><Text style={styles.focusCaption}>consistent</Text></View>
              </View>
            )}
          </Pressable>
        ) : null}

        <Pressable onPress={() => setDashboardOpen(true)} style={styles.dashboardLink}>
          <View><Text style={styles.smallKicker}>HABIT DASHBOARD</Text><Text style={styles.dashboardLinkTitle}>Records & streaks</Text></View>
          <View style={styles.arrowCircle}><Text style={styles.arrowCircleText}>↗</Text></View>
        </Pressable>

        {currentChapter.data ? (
          <View style={styles.chapterStrip}>
            <View>
              <Text style={styles.smallKicker}>CURRENT CHAPTER</Text>
              <Text style={styles.chapterTitle}>{currentChapter.data.title}</Text>
            </View>
            <Text style={styles.chapterDay}>Day {currentChapter.data.days_lived}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <View><Text style={styles.smallKicker}>TODAY</Text><Text style={styles.sectionTitle}>Scheduled for you</Text></View>
          <Text style={styles.date}>{new Date(`${data.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
        </View>

        <ActivitySection
          title="Habits"
          empty="No habits scheduled today."
          items={data.habits.map((habit) => ({ id: habit.id, title: habit.name, meta: habit.life_area.replaceAll('_', ' ').toLowerCase(), completed: Boolean(habit.completion?.completed), onPress: () => completeHabit.mutate({ id: habit.id, date: data.date, completed: !habit.completion?.completed }) }))}
          styles={styles}
        />
        <ActivitySection
          title="Dailies"
          empty="No dailies scheduled today."
          items={data.dailies.map((daily) => ({ id: daily.id, title: daily.title, meta: daily.preferred_time ? daily.preferred_time.slice(0, 5) : daily.life_area.replaceAll('_', ' ').toLowerCase(), completed: Boolean(daily.completion?.completed), onPress: () => completeDaily.mutate({ id: daily.id, date: data.date, completed: !daily.completion?.completed }) }))}
          styles={styles}
        />
        <ActivitySection
          title="Tasks"
          empty="Nothing waiting for you here."
          items={data.tasks.map((task) => ({ id: task.id, title: task.title, meta: task.life_area ? task.life_area.replaceAll('_', ' ').toLowerCase() : task.priority.toLowerCase(), completed: task.completed, onPress: () => completeTask.mutate({ id: task.id, completed: !task.completed }) }))}
          styles={styles}
        />

        <View style={styles.sleepCard}>
          <View>
            <Text style={styles.smallKicker}>REST</Text>
            <Text style={styles.sleepValue}>{sleepCurrent.data ? 'Resting now…' : formatMinutes(data.sleep?.duration_minutes)}</Text>
          </View>
          <Pressable onPress={() => sleep.mutate()} disabled={sleep.isPending} style={styles.sleepButton}>
            <Text style={styles.sleepButtonText}>{sleepCurrent.data ? "I'm awake" : 'Go to sleep'}</Text>
          </Pressable>
        </View>

        <View style={styles.compareCard}>
          <Text style={styles.smallKicker}>YESTERDAY → TODAY</Text>
          <View style={styles.compareRow}>
            <CompareItem label="Habits" delta={data.comparison.habit_delta} styles={styles} />
            <CompareItem label="Tasks" delta={data.comparison.task_delta} styles={styles} />
          </View>
          <Text style={styles.compareNote}>A comparison, not a score.</Text>
        </View>

        <View style={styles.manageRow}>
          <Pressable onPress={() => setManageOpen(!manageOpen)} style={styles.manageButton}><Text style={styles.manageText}>{manageOpen ? 'Hide activity manager' : 'Manage habits, dailies & tasks'}</Text></Pressable>
        </View>
        {manageOpen ? <ActivityManager 
          onEdit={(type, data) => { useComposerStore.getState().open({id: data.id, type: type === 'tasks' ? 'task' : type === 'dailies' ? 'daily' : 'habit', data}); }} 
          onChanged={async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['manage-habits'] }), queryClient.invalidateQueries({ queryKey: ['manage-dailies'] }), queryClient.invalidateQueries({ queryKey: ['manage-tasks'] }), refresh()]); }} 
        /> : null}
      </Screen>

      <HabitDashboard visible={dashboardOpen} onClose={() => setDashboardOpen(false)} />
    </>
  );
}

function ActivitySection({ title, empty, items, styles }: { title: string; empty: string; items: { id: string; title: string; meta: string; completed: boolean; onPress: () => void }[]; styles: any }) {
  return (
    <View style={styles.activityCard}>
      <Text style={styles.activitySectionTitle}>{title}</Text>
      {items.length === 0 ? <Text style={styles.muted}>{empty}</Text> : items.map((item) => (
        <Pressable key={item.id} onPress={item.onPress} style={styles.itemRow}>
          <View style={[styles.check, item.completed && styles.checkDone]}><Text style={styles.checkText}>{item.completed ? '✓' : ''}</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.itemTitle, item.completed && styles.itemDone]}>{item.title}</Text><Text style={styles.itemMeta}>{item.meta}</Text></View>
        </Pressable>
      ))}
    </View>
  );
}

function CompareItem({ label, delta, styles }: { label: string; delta: number; styles: any }) {
  return <View style={styles.compareItem}><Text style={styles.compareDelta}>{delta > 0 ? '+' : ''}{delta}</Text><Text style={styles.compareLabel}>{label}</Text></View>;
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  page: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  name: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 2 },
  rule: { height: 1, backgroundColor: colors.text, opacity: 0.55 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  heroKicker: { color: colors.textMuted, fontSize: 16, fontWeight: '400', marginBottom: 2 },
  heroTitle: { color: colors.text, fontSize: 34, lineHeight: 38, letterSpacing: -1, fontWeight: '700' },
  dayProgress: { alignItems: 'flex-end', paddingBottom: 5 },
  dayProgressValue: { color: colors.text, fontSize: 22, fontWeight: '700' },
  dayProgressLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickTile: { flex: 1, minHeight: 110, borderRadius: radius.lg, padding: 16, justifyContent: 'space-between' },
  blackTile: { backgroundColor: colors.elevatedBackground },
  butterTile: { backgroundColor: colors.surfaceMuted },
  quickLabelLight: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  quickValueLight: { color: colors.text, fontSize: 28, fontWeight: '600' },
  quickUnitLight: { color: colors.textMuted, fontSize: 11 },
  quickLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  quickValue: { color: colors.text, fontSize: 28, fontWeight: '600' },
  quickUnit: { color: colors.textMuted, fontSize: 11 },
  focusHabitCard: { backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: 22, minHeight: 180, justifyContent: 'space-between', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  focusHabitName: { color: colors.text, fontSize: 22, lineHeight: 26, fontWeight: '700', letterSpacing: -0.5 },
  focusHabitSchedule: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  arrow: { color: colors.text, fontSize: 22, opacity: 0.5 },
  focusNumber: { color: colors.text, fontSize: 36, lineHeight: 40, letterSpacing: -1, fontWeight: '600' },
  focusCaption: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  track: { height: 6, borderRadius: 99, backgroundColor: colors.surfaceMuted, overflow: 'hidden', marginTop: 10 },
  fill: { height: '100%', borderRadius: 99, backgroundColor: colors.primary },
  focusStats: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 },
  focusSide: { alignItems: 'flex-end', paddingBottom: 2 },
  focusSideValue: { color: colors.text, fontSize: 22, fontWeight: '700' },
  dashboardLink: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallKicker: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.2, fontWeight: '700', textTransform: 'uppercase' },
  dashboardLinkTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 4 },
  arrowCircle: { width: 34, height: 34, borderRadius: 99, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  arrowCircleText: { color: colors.text, fontSize: 16 },
  chapterStrip: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chapterTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  chapterDay: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  sectionHeader: { marginTop: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4 },
  sectionTitle: { color: colors.text, fontSize: 22, lineHeight: 26, fontWeight: '700', letterSpacing: -0.5, marginTop: 4 },
  date: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  activityCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  activitySectionTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
  check: { width: 28, height: 28, borderRadius: 99, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { color: colors.background, fontWeight: '800' },
  itemTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  itemDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  itemMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  muted: { color: colors.textMuted, padding: 16 },
  sleepCard: { backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sleepValue: { color: colors.text, fontSize: 24, fontWeight: '500', marginTop: 5 },
  sleepButton: { backgroundColor: colors.primary, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 11 },
  sleepButtonText: { color: colors.background, fontWeight: '700', fontSize: 12 },
  compareCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 13 },
  compareRow: { flexDirection: 'row', gap: 10 },
  compareItem: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: 14 },
  compareDelta: { color: colors.text, fontSize: 28, fontWeight: '500' },
  compareLabel: { color: colors.textMuted, fontSize: 11 },
  compareNote: { color: colors.textMuted, fontStyle: 'italic', fontSize: 12 },
  manageRow: { alignItems: 'center', paddingVertical: 4 },
  manageButton: { paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 99 },
  manageText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
});
