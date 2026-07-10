import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { colors, radius, spacing } from '../../theme/tokens';
import type { HabitDashboard as HabitDashboardPayload, HabitDashboardItem, HabitHistoryStatus } from '../../types/api';

export function HabitDashboard({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dashboard = useQuery({
    queryKey: ['habit-dashboard'],
    queryFn: async () => (await api.get<HabitDashboardPayload>('/habits/dashboard/')).data,
    enabled: visible,
  });

  const selected = useMemo(
    () => dashboard.data?.habits.find((habit) => habit.id === selectedId) ?? null,
    [dashboard.data, selectedId],
  );

  function close() {
    setSelectedId(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {dashboard.isLoading ? <View style={styles.center}><ActivityIndicator /></View> : !dashboard.data ? (
          <View style={styles.center}><Text style={styles.muted}>Your rhythm dashboard could not be loaded.</Text></View>
        ) : selected ? (
          <HabitDetail habit={selected} onBack={() => setSelectedId(null)} onClose={close} />
        ) : (
          <DashboardOverview data={dashboard.data} onSelect={setSelectedId} onClose={close} />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function DashboardOverview({ data, onSelect, onClose }: { data: HabitDashboardPayload; onSelect: (id: string) => void; onClose: () => void }) {
  const focus = data.habits.find((habit) => habit.foundation.required && !habit.foundation.established)
    ?? data.habits.find((habit) => habit.status === 'ACTIVE')
    ?? data.habits[0];
  const established = data.habits.filter((habit) => habit.foundation.established);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.kicker}>YOUR RHYTHM</Text>
          <Text style={styles.heroTitle}>records &{`\n`}returns</Text>
        </View>
        <Pressable onPress={onClose} style={styles.roundButton}><Text style={styles.roundButtonText}>×</Text></Pressable>
      </View>

      <View style={styles.mosaicRow}>
        <View style={[styles.metricTile, styles.blackTile]}>
          <Text style={styles.metricLabelLight}>persistence</Text>
          <Text style={styles.metricValueLight}>{data.summary.strongest_persistence_weeks}</Text>
          <Text style={styles.metricUnitLight}>weeks</Text>
        </View>
        <View style={[styles.metricTile, styles.butterTile]}>
          <Text style={styles.metricLabel}>consistency</Text>
          <Text style={styles.metricValue}>{Math.round(data.summary.average_consistency)}%</Text>
          <Text style={styles.metricUnit}>30-day average</Text>
        </View>
      </View>

      {focus ? (
        <Pressable onPress={() => onSelect(focus.id)} style={styles.focusCard}>
          <View style={styles.focusTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.focusName}>{focus.name}</Text>
              <Text style={styles.focusMeta}>{focus.schedule_label}</Text>
            </View>
            <Text style={styles.arrow}>↗</Text>
          </View>
          {focus.foundation.required && !focus.foundation.established ? (
            <>
              <Text style={styles.focusBig}>{focus.foundation.progress} / {focus.foundation.target}</Text>
              <Text style={styles.focusCaption}>foundation check-ins</Text>
              <View style={styles.track}><View style={[styles.fill, { width: `${focus.foundation.percent}%` }]} /></View>
              <Text style={styles.focusHint}>Misses do not reset this. Intentional returns keep building it.</Text>
            </>
          ) : (
            <>
              <Text style={styles.focusBig}>{focus.metrics.persistence_streak_weeks}</Text>
              <Text style={styles.focusCaption}>weeks of persistence</Text>
              <View style={styles.statRow}>
                <MiniStat label="consistency" value={`${Math.round(focus.metrics.consistency_30_days)}%`} />
                <MiniStat label="perfect run" value={`${focus.metrics.perfect_run}`} />
                <MiniStat label="returns" value={`${focus.metrics.returns}`} />
              </View>
            </>
          )}
        </Pressable>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.sectionTitle}>No habits yet.</Text>
          <Text style={styles.muted}>Add a new rhythm or bring in one that already belongs to your life.</Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>YOUR HABITS</Text>
          <Text style={styles.sectionTitle}>what keeps returning</Text>
        </View>
        <Text style={styles.sectionCount}>{data.summary.active_habits}</Text>
      </View>

      <View style={styles.habitGrid}>
        {data.habits.map((habit, index) => (
          <Pressable
            key={habit.id}
            onPress={() => onSelect(habit.id)}
            style={[styles.habitTile, index % 3 === 0 ? styles.mintTile : index % 3 === 1 ? styles.creamTile : styles.greenTile]}
          >
            <Text style={styles.habitName} numberOfLines={2}>{habit.name}</Text>
            <Text style={styles.habitMeta}>{habit.foundation.required && !habit.foundation.established ? `${habit.foundation.progress} / 21 foundation` : `${habit.metrics.persistence_streak_weeks} week persistence`}</Text>
            <View style={styles.habitTileBottom}>
              <Text style={styles.habitSmall}>{Math.round(habit.metrics.consistency_30_days)}% consistent</Text>
              <Text style={styles.arrowSmall}>↗</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {established.length > 0 ? (
        <View style={styles.noteCard}>
          <Text style={styles.noteKicker}>ESTABLISHED</Text>
          <Text style={styles.noteTitle}>{established.length} rhythm{established.length === 1 ? '' : 's'} have a foundation.</Text>
          <Text style={styles.noteBody}>Established does not mean finished. It only means the habit has enough history to belong to the story.</Text>
        </View>
      ) : null}

      <Text style={styles.principle}>{data.principle}</Text>
    </ScrollView>
  );
}

function HabitDetail({ habit, onBack, onClose }: { habit: HabitDashboardItem; onBack: () => void; onClose: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} style={styles.roundButton}><Text style={styles.roundButtonText}>←</Text></Pressable>
        <Text style={styles.detailHeaderTitle}>habit</Text>
        <Pressable onPress={onClose} style={styles.roundButton}><Text style={styles.roundButtonText}>×</Text></Pressable>
      </View>
      <View style={styles.rule} />

      <Text style={styles.detailName}>{habit.name}</Text>
      <Text style={styles.detailSchedule}>{habit.schedule_label}{habit.preferred_time ? ` · ${habit.preferred_time.slice(0, 5)}` : ''}</Text>

      <View style={styles.persistenceHero}>
        <View>
          <Text style={styles.persistenceNumber}>{habit.metrics.persistence_streak_weeks}</Text>
          <Text style={styles.persistenceCaption}>weeks of persistence</Text>
        </View>
        <View style={styles.persistenceSide}>
          <Text style={styles.sideLabel}>best</Text>
          <Text style={styles.sideValue}>{habit.metrics.longest_persistence_weeks}</Text>
          <Text style={styles.sideLabel}>weeks</Text>
        </View>
      </View>

      <View style={styles.detailStats}>
        <DetailStat label="consistency" value={`${Math.round(habit.metrics.consistency_30_days)}%`} detail="last 30 days" />
        <DetailStat label="perfect run" value={`${habit.metrics.perfect_run}`} detail="scheduled check-ins" />
        <DetailStat label="returns" value={`${habit.metrics.returns}`} detail="after quiet gaps" />
      </View>

      {habit.foundation.required ? (
        <View style={styles.foundationCard}>
          <View style={styles.focusTop}>
            <View>
              <Text style={styles.sectionEyebrow}>21-DAY FOUNDATION</Text>
              <Text style={styles.foundationTitle}>{habit.foundation.established ? 'Established' : `${habit.foundation.progress} of ${habit.foundation.target}`}</Text>
            </View>
            <Text style={styles.foundationPercent}>{habit.foundation.percent}%</Text>
          </View>
          <View style={styles.track}><View style={[styles.fill, { width: `${habit.foundation.percent}%` }]} /></View>
          <Text style={styles.focusHint}>{habit.foundation.message}</Text>
        </View>
      ) : (
        <View style={styles.existingCard}>
          <Text style={styles.sectionEyebrow}>EXISTING RHYTHM</Text>
          <Text style={styles.foundationTitle}>This already belonged to your life.</Text>
          <Text style={styles.focusHint}>Hearth started observing it without pretending your earlier effort never happened.</Text>
        </View>
      )}

      <View style={styles.historyCard}>
        <View style={styles.focusTop}>
          <View>
            <Text style={styles.sectionEyebrow}>HISTORY</Text>
            <Text style={styles.historyTitle}>35 days</Text>
          </View>
          <Text style={styles.historyHint}>scheduled, not random</Text>
        </View>
        <View style={styles.calendarGrid}>
          {habit.history.map((day, index) => (
            <View key={day.date} style={styles.calendarCell}>
              <View style={[styles.dayDot, historyStyle(day.status), index === habit.history.length - 1 && styles.todayDot]} />
              <Text style={styles.dayNumber}>{Number(day.date.slice(-2))}</Text>
            </View>
          ))}
        </View>
        <View style={styles.legendRow}>
          <LegendDot color={colors.ink} label="done" />
          <LegendDot color={colors.mintStrong} label="scheduled" />
          <LegendDot color="transparent" border label="rest" />
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteKicker}>WHY PERSISTENCE?</Text>
        <Text style={styles.noteTitle}>A missed day does not erase a person who returns.</Text>
        <Text style={styles.noteBody}>Persistence needs an intentional schedule and repeated follow-through. Random occasional check-ins do not build this streak.</Text>
      </View>
    </ScrollView>
  );
}

function historyStyle(status: HabitHistoryStatus) {
  if (status === 'COMPLETE') return { backgroundColor: colors.ink, borderColor: colors.ink };
  if (status === 'MISSED') return { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted };
  if (status === 'OPEN') return { backgroundColor: colors.mint, borderColor: colors.primary };
  return { backgroundColor: 'transparent', borderColor: colors.border };
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <View style={{ flex: 1 }}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue}>{value}</Text></View>;
}

function DetailStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <View style={styles.detailStat}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.detailStatValue}>{value}</Text><Text style={styles.metricUnit}>{detail}</Text></View>;
}

function LegendDot({ color, label, border = false }: { color: string; label: string; border?: boolean }) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color, borderWidth: border ? 1 : 0, borderColor: colors.border }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { padding: 20, paddingBottom: 48, gap: 18 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  kicker: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  heroTitle: { color: colors.ink, fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -1, marginTop: 4 },
  roundButton: { width: 44, height: 44, borderRadius: 99, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  roundButtonText: { color: colors.ink, fontSize: 23, lineHeight: 25 },
  mosaicRow: { flexDirection: 'row', gap: 10 },
  metricTile: { flex: 1, minHeight: 120, borderRadius: radius.lg, padding: 16, justifyContent: 'space-between' },
  blackTile: { backgroundColor: colors.black },
  butterTile: { backgroundColor: colors.butter },
  metricLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '600' },
  metricLabelLight: { color: '#D4D8D2', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '600' },
  metricValue: { color: colors.ink, fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  metricValueLight: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  metricUnit: { color: colors.textMuted, fontSize: 11 },
  metricUnitLight: { color: '#BFC5BE', fontSize: 11 },
  focusCard: { backgroundColor: colors.mint, borderRadius: radius.xl, padding: 20, gap: 10, minHeight: 180 },
  focusTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  focusName: { color: colors.ink, fontSize: 24, lineHeight: 28, fontWeight: '600', letterSpacing: -0.5 },
  focusMeta: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  arrow: { color: colors.ink, fontSize: 24 },
  focusBig: { color: colors.ink, fontSize: 36, lineHeight: 42, fontWeight: '700', letterSpacing: -1.5, marginTop: 4 },
  focusCaption: { color: colors.text, fontSize: 14 },
  track: { height: 7, borderRadius: 99, backgroundColor: 'rgba(17,20,18,0.10)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99, backgroundColor: colors.ink },
  focusHint: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  statRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  miniLabel: { color: colors.textMuted, fontSize: 10 },
  miniValue: { color: colors.ink, fontSize: 19, fontWeight: '700', marginTop: 2 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 8 },
  muted: { color: colors.textMuted },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  sectionEyebrow: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' },
  sectionTitle: { color: colors.ink, fontSize: 22, lineHeight: 26, fontWeight: '600', letterSpacing: -0.5, marginTop: 2 },
  sectionCount: { color: colors.ink, fontSize: 18, fontWeight: '600' },
  habitGrid: { gap: 10 },
  habitTile: { borderRadius: radius.lg, padding: 18, minHeight: 110, justifyContent: 'space-between' },
  mintTile: { backgroundColor: colors.mint },
  creamTile: { backgroundColor: colors.surface },
  greenTile: { backgroundColor: colors.primarySoft },
  habitName: { color: colors.ink, fontSize: 18, lineHeight: 22, fontWeight: '600' },
  habitMeta: { color: colors.textMuted, marginTop: 8 },
  habitTileBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18 },
  habitSmall: { color: colors.textMuted, fontSize: 11 },
  arrowSmall: { color: colors.ink, fontSize: 18 },
  noteCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 8 },
  noteKicker: { color: colors.primary, fontSize: 10, letterSpacing: 1.2, fontWeight: '800' },
  noteTitle: { color: colors.ink, fontSize: 23, lineHeight: 28, fontWeight: '600' },
  noteBody: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  principle: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', lineHeight: 20, paddingHorizontal: 18, marginVertical: 8 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailHeaderTitle: { color: colors.ink, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  rule: { height: 1, backgroundColor: colors.ink, opacity: 0.25 },
  detailName: { color: colors.ink, fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -1, marginTop: 10 },
  detailSchedule: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  persistenceHero: { minHeight: 180, backgroundColor: colors.mint, borderRadius: radius.xl, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  persistenceNumber: { color: colors.ink, fontSize: 64, lineHeight: 68, fontWeight: '700', letterSpacing: -3 },
  persistenceCaption: { color: colors.ink, fontSize: 15 },
  persistenceSide: { alignItems: 'flex-end' },
  sideLabel: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  sideValue: { color: colors.ink, fontSize: 24, fontWeight: '700' },
  detailStats: { flexDirection: 'row', gap: 8 },
  detailStat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, minHeight: 116 },
  detailStatValue: { color: colors.ink, fontSize: 28, fontWeight: '600', marginVertical: 8 },
  foundationCard: { backgroundColor: colors.butter, borderRadius: radius.xl, padding: 20, gap: 12 },
  existingCard: { backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: 20, gap: 10 },
  foundationTitle: { color: colors.ink, fontSize: 25, lineHeight: 29, fontWeight: '600', marginTop: 4 },
  foundationPercent: { color: colors.ink, fontSize: 24 },
  historyCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 16 },
  historyTitle: { color: colors.ink, fontSize: 28, fontWeight: '500' },
  historyHint: { color: colors.textMuted, fontSize: 11 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  calendarCell: { width: '11.8%', alignItems: 'center', gap: 4 },
  dayDot: { width: 28, height: 28, borderRadius: 99, borderWidth: 1 },
  todayDot: { borderWidth: 2, borderColor: colors.ink },
  dayNumber: { color: colors.textMuted, fontSize: 9 },
  legendRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 99 },
  legendText: { color: colors.textMuted, fontSize: 10 },
});
