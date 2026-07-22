import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { ActivityManager } from './ActivityManager';
import { HabitDashboard } from './HabitDashboard';
import { radius, spacing, fonts } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useComposerStore } from '../../store/composerStore';
import { useResponsive } from '../../hooks/useResponsive';
import type { Chapter, HabitDashboard as HabitDashboardPayload, TodayPayload, User } from '../../types/api';

function formatMinutes(value?: number | null) {
  if (value == null) return 'No sleep record';
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h ${minutes}m`;
}

function sleepRecordLabel(sleep?: TodayPayload['sleep']) {
  if (!sleep) return 'No sleep record';
  return `${sleep.session_type === 'NAP' ? 'Nap' : 'Main sleep'} · ${formatMinutes(sleep.duration_minutes)}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function getActivityColor(type: string, category: string) {
  const cat = (category || '').toUpperCase();
  if (cat === 'HEALTH') return '76, 175, 80'; // Green
  if (cat === 'CAREER') return '33, 150, 243'; // Blue
  if (cat === 'LEARNING') return '255, 152, 0'; // Orange
  if (cat === 'MINDFULNESS') return '156, 39, 176'; // Purple
  if (cat === 'RELATIONSHIPS') return '233, 30, 99'; // Pink
  if (cat === 'CREATIVITY') return '0, 188, 212'; // Cyan
  if (cat === 'REST' || cat === 'SLEEP') return '63, 81, 181'; // Indigo
  if (cat === 'PERSONAL_GROWTH') return '0, 150, 136'; // Teal
  if (cat === 'LIFE_ADMIN') return '96, 125, 139'; // Blue Grey
  
  if (type === 'Habits') return '156, 39, 176'; // Purple
  if (type === 'Dailies') return '33, 150, 243'; // Blue
  if (type === 'Tasks') return '255, 152, 0'; // Orange

  return '158, 158, 158'; // Grey
}

export function TodayScreen() {
  const { colors } = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const styles = useStyles(colors, isDesktop, isTablet);
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
          habits: previous.habits.map(h => h.id === id ? { ...h, completion: { completed, value: h.completion?.value ?? null } } : h)
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
          {(isTablet || isDesktop) && (
            <View style={[styles.quickTile, { backgroundColor: colors.primarySoft }]}>
              <Text style={styles.quickLabel}>Progress</Text>
              <Text style={styles.quickValue}>{data.progress_percent}%</Text>
              <Text style={styles.quickUnit}>done today</Text>
            </View>
          )}
        </View>

        {/* Two-column layout for tablet/desktop */}
        {(isTablet || isDesktop) ? (
          <View style={styles.twoCol}>
            {/* Left column: activities */}
            <View style={styles.leftCol}>
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

              <View style={styles.sectionHeader}>
                <View><Text style={styles.smallKicker}>TODAY</Text><Text style={styles.sectionTitle}>Scheduled for you</Text></View>
                <Text style={styles.date}>{new Date(`${data.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
              </View>

              <ActivitySection title="Habits" empty="No habits scheduled today." items={data.habits.map((habit) => ({ id: habit.id, title: habit.name, meta: habit.life_area.replaceAll('_', ' ').toLowerCase(), category: habit.life_area, completed: Boolean(habit.completion?.completed), onPress: () => completeHabit.mutate({ id: habit.id, date: data.date, completed: !habit.completion?.completed }) }))} styles={styles} />
              <ActivitySection title="Dailies" empty="No dailies scheduled today." items={data.dailies.map((daily) => ({ id: daily.id, title: daily.title, meta: daily.preferred_time ? daily.preferred_time.slice(0, 5) : daily.life_area.replaceAll('_', ' ').toLowerCase(), category: daily.life_area, completed: Boolean(daily.completion?.completed), onPress: () => completeDaily.mutate({ id: daily.id, date: data.date, completed: !daily.completion?.completed }) }))} styles={styles} />
              <ActivitySection title="Tasks" empty="Nothing waiting for you here." items={data.tasks.map((task) => ({ id: task.id, title: task.title, meta: task.life_area ? task.life_area.replaceAll('_', ' ').toLowerCase() : task.priority.toLowerCase(), category: task.life_area || '', completed: task.completed, onPress: () => completeTask.mutate({ id: task.id, completed: !task.completed }) }))} styles={styles} />

              <View style={styles.manageRow}>
                <Pressable onPress={() => setManageOpen(!manageOpen)} style={styles.manageButton}><Text style={styles.manageText}>{manageOpen ? 'Hide activity manager' : 'Manage habits, dailies & tasks'}</Text></Pressable>
              </View>
              {manageOpen ? <ActivityManager
                onEdit={(type, data) => { useComposerStore.getState().open({id: data.id, type: type === 'tasks' ? 'task' : type === 'dailies' ? 'daily' : 'habit', data}); }}
                onChanged={async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['manage-habits'] }), queryClient.invalidateQueries({ queryKey: ['manage-dailies'] }), queryClient.invalidateQueries({ queryKey: ['manage-tasks'] }), refresh()]); }}
              /> : null}
            </View>

            {/* Right column: stats/sleep/compare */}
            <View style={styles.rightCol}>
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

              <View style={styles.sleepCard}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.smallKicker}>REST TRACKER</Text>
                  <Text style={styles.sleepValue}>{sleepCurrent.data ? 'You are resting…' : sleepRecordLabel(data.sleep)}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={() => !sleepCurrent.data && sleep.mutate()} disabled={sleep.isPending || !!sleepCurrent.data} style={[styles.sleepButton, !!sleepCurrent.data && styles.sleepButtonDisabled]}>
                    <Text style={styles.sleepButtonText}>Start sleep</Text>
                  </Pressable>
                  <Pressable onPress={() => sleepCurrent.data && sleep.mutate()} disabled={sleep.isPending || !sleepCurrent.data} style={[styles.sleepButton, !sleepCurrent.data && styles.sleepButtonDisabled]}>
                    <Text style={styles.sleepButtonText}>Wake up</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.compareCard}>
                <Text style={styles.smallKicker}>YESTERDAY → TODAY</Text>
                <View style={styles.compareRow}>
                  <CompareItem label="Habits" delta={data.comparison.habit_delta} styles={styles} />
                  <CompareItem label="Tasks" delta={data.comparison.task_delta} styles={styles} />
                </View>
                <Text style={styles.compareNote}>A comparison, not a score.</Text>
              </View>
            </View>
          </View>
        ) : (
          // ── Mobile single-column ──────────────────────────────────────────
          <>
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

            <ActivitySection title="Habits" empty="No habits scheduled today." items={data.habits.map((habit) => ({ id: habit.id, title: habit.name, meta: habit.life_area.replaceAll('_', ' ').toLowerCase(), category: habit.life_area, completed: Boolean(habit.completion?.completed), onPress: () => completeHabit.mutate({ id: habit.id, date: data.date, completed: !habit.completion?.completed }) }))} styles={styles} />
            <ActivitySection title="Dailies" empty="No dailies scheduled today." items={data.dailies.map((daily) => ({ id: daily.id, title: daily.title, meta: daily.preferred_time ? daily.preferred_time.slice(0, 5) : daily.life_area.replaceAll('_', ' ').toLowerCase(), category: daily.life_area, completed: Boolean(daily.completion?.completed), onPress: () => completeDaily.mutate({ id: daily.id, date: data.date, completed: !daily.completion?.completed }) }))} styles={styles} />
            <ActivitySection title="Tasks" empty="Nothing waiting for you here." items={data.tasks.map((task) => ({ id: task.id, title: task.title, meta: task.life_area ? task.life_area.replaceAll('_', ' ').toLowerCase() : task.priority.toLowerCase(), category: task.life_area || '', completed: task.completed, onPress: () => completeTask.mutate({ id: task.id, completed: !task.completed }) }))} styles={styles} />

            <View style={styles.sleepCard}>
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.smallKicker}>REST TRACKER</Text>
                <Text style={styles.sleepValue}>{sleepCurrent.data ? 'You are resting…' : sleepRecordLabel(data.sleep)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => !sleepCurrent.data && sleep.mutate()} disabled={sleep.isPending || !!sleepCurrent.data} style={[styles.sleepButton, !!sleepCurrent.data && styles.sleepButtonDisabled]}>
                  <Text style={styles.sleepButtonText}>Start sleep</Text>
                </Pressable>
                <Pressable onPress={() => sleepCurrent.data && sleep.mutate()} disabled={sleep.isPending || !sleepCurrent.data} style={[styles.sleepButton, !sleepCurrent.data && styles.sleepButtonDisabled]}>
                  <Text style={styles.sleepButtonText}>Wake up</Text>
                </Pressable>
              </View>
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
          </>
        )}
      </Screen>

      <HabitDashboard visible={dashboardOpen} onClose={() => setDashboardOpen(false)} />
    </>
  );
}

function ActivitySection({ title, empty, items, styles }: { title: string; empty: string; items: { id: string; title: string; meta: string; category: string; completed: boolean; onPress: () => void }[]; styles: any }) {
  if (items.length === 0) return null; // Hide empty sections entirely to keep UI clean and fast

  return (
    <View style={styles.activitySection}>
      <Text style={styles.activitySectionTitle}>{title}</Text>
      <View style={{ gap: 12 }}>
        {items.map((item) => {
          const color = getActivityColor(title, item.category);
          return (
            <Pressable key={item.id} onPress={item.onPress} style={[styles.glassCard, { backgroundColor: `rgba(${color}, 0.12)`, borderColor: `rgba(${color}, 0.25)` }]}>
              <View style={[styles.iconBox, { backgroundColor: `rgba(${color}, 0.15)` }]}>
                <Text style={[styles.iconText, { color: `rgb(${color})` }]}>{item.title.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 14 }}>
                <Text style={[styles.itemTitle, item.completed && styles.itemDone]}>{item.title}</Text>
                <Text style={[styles.itemMeta, { color: `rgba(${color}, 0.9)` }, item.completed && { opacity: 0.5 }]}>{item.meta}</Text>
              </View>
              <View style={[styles.glassCheck, item.completed && { backgroundColor: `rgb(${color})`, borderColor: `rgb(${color})` }, !item.completed && { borderColor: `rgba(${color}, 0.35)` }]}>
                <Text style={styles.checkText}>{item.completed ? '✓' : ''}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CompareItem({ label, delta, styles }: { label: string; delta: number; styles: any }) {
  return <View style={styles.compareItem}><Text style={styles.compareDelta}>{delta > 0 ? '+' : ''}{delta}</Text><Text style={styles.compareLabel}>{label}</Text></View>;
}

const useStyles = (colors: ThemeColors, isDesktop = false, isTablet = false) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  page: { padding: isDesktop ? 28 : 20, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontFamily: fonts.extraBold },
  name: { color: colors.text, fontSize: isDesktop ? 26 : 22, fontFamily: fonts.extraBold, marginTop: 2 },
  rule: { height: 1, backgroundColor: colors.border, opacity: 0.8 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  heroKicker: { color: colors.textMuted, fontSize: 16, fontFamily: fonts.medium, marginBottom: 2 },
  heroTitle: { color: colors.text, fontSize: isDesktop ? 44 : 34, lineHeight: isDesktop ? 50 : 38, letterSpacing: -1, fontFamily: fonts.extraBold },
  dayProgress: { alignItems: 'flex-end', paddingBottom: 5 },
  dayProgressValue: { color: colors.text, fontSize: 24, fontFamily: fonts.extraBold },
  dayProgressLabel: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickTile: { flex: 1, minHeight: isDesktop ? 130 : 110, borderRadius: radius.lg, padding: 16, justifyContent: 'space-between' },
  blackTile: { backgroundColor: colors.elevatedBackground },
  butterTile: { backgroundColor: colors.surfaceMuted },
  quickLabelLight: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontFamily: fonts.extraBold },
  quickValueLight: { color: colors.text, fontSize: isDesktop ? 34 : 28, fontFamily: fonts.bold },
  quickUnitLight: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium },
  quickLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontFamily: fonts.extraBold },
  quickValue: { color: colors.text, fontSize: isDesktop ? 34 : 28, fontFamily: fonts.bold },
  quickUnit: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium },
  // Two-column layout
  twoCol: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  leftCol: { flex: 1.4, gap: 16 },
  rightCol: { flex: 1, gap: 16 },
  focusHabitCard: { backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: 22, minHeight: 180, justifyContent: 'space-between', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  focusHabitName: { color: colors.text, fontSize: 22, lineHeight: 26, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  focusHabitSchedule: { color: colors.textMuted, marginTop: 4, fontSize: 13, fontFamily: fonts.medium },
  arrow: { color: colors.text, fontSize: 22, opacity: 0.5 },
  focusNumber: { color: colors.text, fontSize: 36, lineHeight: 40, letterSpacing: -1, fontFamily: fonts.extraBold },
  focusCaption: { color: colors.textMuted, fontSize: 13, marginTop: 2, fontFamily: fonts.medium },
  track: { height: 6, borderRadius: 99, backgroundColor: colors.surfaceMuted, overflow: 'hidden', marginTop: 10 },
  fill: { height: '100%', borderRadius: 99, backgroundColor: colors.primary },
  focusStats: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 },
  focusSide: { alignItems: 'flex-end', paddingBottom: 2 },
  focusSideValue: { color: colors.text, fontSize: 22, fontFamily: fonts.bold },
  dashboardLink: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallKicker: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.2, fontFamily: fonts.extraBold, textTransform: 'uppercase' },
  dashboardLinkTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.bold, marginTop: 4 },
  arrowCircle: { width: 34, height: 34, borderRadius: 99, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  arrowCircleText: { color: colors.text, fontSize: 16, fontFamily: fonts.medium },
  chapterStrip: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chapterTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold, marginTop: 4 },
  chapterDay: { color: colors.primary, fontFamily: fonts.extraBold, fontSize: 13 },
  sectionHeader: { marginTop: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4 },
  sectionTitle: { color: colors.text, fontSize: 22, lineHeight: 26, fontFamily: fonts.extraBold, letterSpacing: -0.5, marginTop: 4 },
  date: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.bold },
  activitySection: { marginVertical: 6 },
  activitySectionTitle: { color: colors.text, fontSize: 13, fontFamily: fonts.extraBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  glassCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.xl, borderWidth: 1 },
  iconBox: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20, fontFamily: fonts.extraBold },
  glassCheck: { width: 30, height: 30, borderRadius: 99, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: colors.background, fontFamily: fonts.extraBold },
  itemTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  itemDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  itemMeta: { fontSize: 12, marginTop: 4, fontFamily: fonts.medium },
  muted: { color: colors.textMuted, padding: 16, fontFamily: fonts.regular },
  sleepCard: { backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: 19, flexDirection: 'column', gap: 4 },
  sleepValue: { color: colors.text, fontSize: 24, fontFamily: fonts.extraBold, marginTop: 5 },
  sleepButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  sleepButtonDisabled: { opacity: 0.3 },
  sleepButtonText: { color: colors.background, fontFamily: fonts.bold, fontSize: 13 },
  compareCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 13 },
  compareRow: { flexDirection: 'row', gap: 10 },
  compareItem: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: 14 },
  compareDelta: { color: colors.text, fontSize: 28, fontFamily: fonts.bold },
  compareLabel: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium },
  compareNote: { color: colors.textMuted, fontStyle: 'italic', fontSize: 12, fontFamily: fonts.regular },
  manageRow: { alignItems: 'center', paddingVertical: 4 },
  manageButton: { paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 99 },
  manageText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13 },
});
