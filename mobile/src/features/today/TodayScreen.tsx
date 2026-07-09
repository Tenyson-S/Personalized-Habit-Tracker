import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { ActivityComposer } from './ActivityComposer';
import { ActivityManager } from './ActivityManager';
import { colors, radius, spacing } from '../../theme/tokens';
import type { Chapter, TodayPayload, VillageWorld } from '../../types/api';

function formatMinutes(value?: number | null) {
  if (value == null) return 'No sleep recorded';
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h ${minutes}m`;
}

export function TodayScreen() {
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const today = useQuery({ queryKey: ['today'], queryFn: async () => (await api.get<TodayPayload>('/today/')).data });
  const sleepCurrent = useQuery({ queryKey: ['sleep-current'], queryFn: async () => (await api.get('/sleep/current/')).data });
  const village = useQuery({ queryKey: ['village'], queryFn: async () => (await api.get<VillageWorld>('/village/')).data, staleTime: 20_000 });
  const currentChapter = useQuery({ queryKey: ['chapter-current'], queryFn: async () => (await api.get<Chapter | null>('/chapters/current/')).data });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['today'] }),
      queryClient.invalidateQueries({ queryKey: ['village'] }),
    ]);
  };
  const completeHabit = useMutation({
    mutationFn: async ({ id, date, completed }: { id: string; date: string; completed: boolean }) => api.put(`/habits/${id}/completion/${date}/`, { completed }),
    onSuccess: refresh,
  });
  const completeDaily = useMutation({
    mutationFn: async ({ id, date, completed }: { id: string; date: string; completed: boolean }) => api.put(`/dailies/${id}/completion/${date}/`, { completed }),
    onSuccess: refresh,
  });
  const completeTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => api.post(`/tasks/${id}/complete/`, { completed }),
    onSuccess: refresh,
  });
  const sleep = useMutation({
    mutationFn: async () => sleepCurrent.data ? api.post('/sleep/wake/', {}) : api.post('/sleep/start/', {}),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sleep-current'] }),
        queryClient.invalidateQueries({ queryKey: ['today'] }),
        queryClient.invalidateQueries({ queryKey: ['village'] }),
      ]);
    },
  });

  if (today.isLoading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!today.data) return <View style={styles.center}><Text>Could not load today.</Text></View>;
  const data = today.data;

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>TODAY</Text>
        <Text style={styles.title}>Your day is taking shape.</Text>
        <Text style={styles.muted}>{data.date}</Text>
      </View>

      <Card>
        <View style={styles.rowBetween}><Text style={styles.sectionTitle}>Today</Text><Text style={styles.progressText}>{data.progress_percent}%</Text></View>
        <ProgressBar value={data.progress_percent} />
      </Card>

      {currentChapter.data ? (
        <View style={styles.chapterCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.chapterEyebrow}>CURRENT CHAPTER</Text>
            <Text style={styles.chapterDay}>Day {currentChapter.data.days_lived}</Text>
          </View>
          <Text style={styles.chapterTitle}>{currentChapter.data.title}</Text>
          {currentChapter.data.intention ? <Text style={styles.chapterIntention}>{currentChapter.data.intention}</Text> : null}
          <Text style={styles.chapterHint}>This gives context to the life you are already living. Manage it from Journey.</Text>
        </View>
      ) : village.data ? (
        <Card>
          <Text style={styles.sectionTitle}>Your {village.data.stage_label}</Text>
          <Text style={styles.muted}>Real-life actions are becoming visible. A life chapter can be started from Journey whenever one feels true.</Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Habits</Text>
        {data.habits.length === 0 ? <Text style={styles.muted}>No habits scheduled today.</Text> : data.habits.map((habit) => {
          const completed = Boolean(habit.completion?.completed);
          return (
            <Pressable key={habit.id} onPress={() => completeHabit.mutate({ id: habit.id, date: data.date, completed: !completed })} style={styles.itemRow}>
              <View style={[styles.check, completed && styles.checkDone]}><Text>{completed ? '✓' : ''}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{habit.name}</Text><Text style={styles.muted}>{habit.life_area.replaceAll('_', ' ')}</Text></View>
            </Pressable>
          );
        })}
      </Card>


      <Card>
        <Text style={styles.sectionTitle}>Dailies</Text>
        {data.dailies.length === 0 ? <Text style={styles.muted}>No dailies scheduled today.</Text> : data.dailies.map((daily) => {
          const completed = Boolean(daily.completion?.completed);
          return <Pressable key={daily.id} onPress={() => completeDaily.mutate({ id: daily.id, date: data.date, completed: !completed })} style={styles.itemRow}>
            <View style={[styles.check, completed && styles.checkDone]}><Text>{completed ? '✓' : ''}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{daily.title}</Text><Text style={styles.muted}>{daily.life_area.replaceAll('_',' ')}</Text></View>
          </Pressable>;
        })}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Tasks</Text>
        {data.tasks.length === 0 ? <Text style={styles.muted}>Nothing waiting for you here.</Text> : data.tasks.map((task) => (
          <Pressable key={task.id} onPress={() => completeTask.mutate({ id: task.id, completed: !task.completed })} style={styles.itemRow}>
            <View style={[styles.check, task.completed && styles.checkDone]}><Text>{task.completed ? '✓' : ''}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{task.title}</Text><Text style={styles.muted}>{task.life_area.replaceAll('_',' ')}</Text></View>
          </Pressable>
        ))}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Sleep</Text>
        <Text style={styles.sleepValue}>{sleepCurrent.data ? 'Resting now…' : formatMinutes(data.sleep?.duration_minutes)}</Text>
        <Pressable onPress={() => sleep.mutate()} disabled={sleep.isPending} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{sleepCurrent.data ? "☀️ I'm Awake" : '🌙 Going to Sleep'}</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Yesterday vs Today</Text>
        <Text style={styles.reflectionLine}>Habits {data.comparison.habit_delta >= 0 ? '▲' : '▼'} {Math.abs(data.comparison.habit_delta)}</Text>
        <Text style={styles.reflectionLine}>Tasks {data.comparison.task_delta >= 0 ? '▲' : '▼'} {Math.abs(data.comparison.task_delta)}</Text>
        <Text style={styles.muted}>A comparison, not a score.</Text>
      </Card>

      <View style={styles.actionRow}>
        <Pressable onPress={() => setComposerOpen(true)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>+ Add activity</Text></Pressable>
        <Pressable onPress={() => setManageOpen(!manageOpen)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{manageOpen ? 'Hide manager' : 'Manage'}</Text></Pressable>
      </View>
      {manageOpen ? <ActivityManager onChanged={async () => { await Promise.all([queryClient.invalidateQueries({queryKey:['manage-habits']}),queryClient.invalidateQueries({queryKey:['manage-dailies']}),queryClient.invalidateQueries({queryKey:['manage-tasks']}),refresh()]); }} /> : null}
      <ActivityComposer visible={composerOpen} onClose={() => setComposerOpen(false)} onSaved={async () => { await Promise.all([queryClient.invalidateQueries({queryKey:['manage-habits']}),queryClient.invalidateQueries({queryKey:['manage-dailies']}),queryClient.invalidateQueries({queryKey:['manage-tasks']}),refresh()]); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  eyebrow: { color: colors.primary, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  progressText: { color: colors.primary, fontWeight: '700' },
  muted: { color: colors.textMuted },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  itemTitle: { color: colors.text, fontWeight: '600' },
  check: { width: 28, height: 28, borderRadius: 99, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  sleepValue: { color: colors.text, fontSize: 26, fontWeight: '700' },
  primaryButton: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontWeight: '700' },
  reflectionLine: { color: colors.text, fontSize: 16 },
  chapterCard: { backgroundColor: '#E7EBDD', borderRadius: 22, borderWidth: 1, borderColor: '#D4DBC9', padding: 18, gap: 8 },
  chapterEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  chapterDay: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  chapterTitle: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '800' },
  chapterIntention: { color: '#536052', lineHeight: 21, fontStyle: 'italic' },
  chapterHint: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 2 },
  segmentRow: { flexDirection: 'row', gap: spacing.sm },
  segment: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99, borderWidth: 1, borderColor: colors.border },
  segmentActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  segmentText: { color: colors.textMuted },
  segmentTextActive: { color: colors.text, fontWeight: '700' },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text },
  secondaryButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  secondaryButtonText: { color: colors.primary, fontWeight: '700' },
  actionRow: { gap: spacing.sm },
});
