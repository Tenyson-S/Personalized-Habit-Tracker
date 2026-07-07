import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { colors, radius, spacing } from '../../theme/tokens';
import type { TodayPayload, VillageWorld } from '../../types/api';

function formatMinutes(value?: number | null) {
  if (value == null) return 'No sleep recorded';
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h ${minutes}m`;
}

function QuickAdd({ onCreated }: { onCreated: () => void }) {
  const [mode, setMode] = useState<'habit' | 'task'>('habit');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!title.trim()) return;
    try {
      setSaving(true);
      if (mode === 'habit') {
        await api.post('/habits/', {
          name: title.trim(),
          life_area: 'PERSONAL_GROWTH',
          habit_type: 'BOOLEAN',
          target_value: null,
          unit: '',
          start_date: new Date().toISOString().slice(0, 10),
          is_active: true,
          schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
        });
      } else {
        await api.post('/tasks/', { title: title.trim(), life_area: 'OTHER', priority: 'NORMAL', due_date: new Date().toISOString().slice(0, 10) });
      }
      setTitle('');
      onCreated();
    } catch {
      Alert.alert('Could not add it', 'Nothing was lost. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <Text style={styles.sectionTitle}>Add something that matters</Text>
      <View style={styles.segmentRow}>
        {(['habit', 'task'] as const).map((item) => (
          <Pressable key={item} onPress={() => setMode(item)} style={[styles.segment, mode === item && styles.segmentActive]}>
            <Text style={mode === item ? styles.segmentTextActive : styles.segmentText}>{item === 'habit' ? 'Habit' : 'Task'}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput value={title} onChangeText={setTitle} placeholder={mode === 'habit' ? 'Example: Read for a while' : 'Example: Finish portfolio section'} style={styles.input} />
      <Pressable onPress={create} disabled={saving || !title.trim()} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>{saving ? 'Adding…' : 'Add quietly'}</Text>
      </Pressable>
    </Card>
  );
}

export function TodayScreen() {
  const queryClient = useQueryClient();
  const today = useQuery({ queryKey: ['today'], queryFn: async () => (await api.get<TodayPayload>('/today/')).data });
  const sleepCurrent = useQuery({ queryKey: ['sleep-current'], queryFn: async () => (await api.get('/sleep/current/')).data });
  const village = useQuery({ queryKey: ['village'], queryFn: async () => (await api.get<VillageWorld>('/village/')).data, staleTime: 20_000 });

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

      {village.data && (
        <Card>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>Your {village.data.stage_label}</Text>
              <Text style={styles.muted}>Real-life actions are becoming visible.</Text>
            </View>
            <View style={styles.villageMiniStats}>
              <Text style={styles.progressText}>{village.data.total_xp} XP</Text>
              <Text style={styles.coinText}>🪙 {village.data.coins}</Text>
            </View>
          </View>
          <ProgressBar value={village.data.next_stage.progress_percent} />
        </Card>
      )}

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
        <Text style={styles.sectionTitle}>Tasks</Text>
        {data.tasks.length === 0 ? <Text style={styles.muted}>Nothing waiting for you here.</Text> : data.tasks.map((task) => (
          <Pressable key={task.id} onPress={() => completeTask.mutate({ id: task.id, completed: !task.completed })} style={styles.itemRow}>
            <View style={[styles.check, task.completed && styles.checkDone]}><Text>{task.completed ? '✓' : ''}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{task.title}</Text><Text style={styles.muted}>{task.priority.toLowerCase()}</Text></View>
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

      <QuickAdd onCreated={refresh} />
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
  villageMiniStats: { alignItems: 'flex-end', gap: 4 },
  coinText: { color: colors.text, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', gap: spacing.sm },
  segment: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99, borderWidth: 1, borderColor: colors.border },
  segmentActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  segmentText: { color: colors.textMuted },
  segmentTextActive: { color: colors.text, fontWeight: '700' },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text },
  secondaryButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  secondaryButtonText: { color: colors.primary, fontWeight: '700' },
});
