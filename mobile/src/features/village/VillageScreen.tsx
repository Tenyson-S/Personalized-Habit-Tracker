import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import type { VillageBuilding, VillageRewardEvent, VillageWorld } from '../../types/api';
import { VillageWorldScene } from './VillageWorldScene';

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function storyEyebrow(kind: VillageWorld['story']['kind']) {
  if (kind === 'TODAY_CHANGED') return 'TODAY LEFT A MARK';
  if (kind === 'RECENT_MEMORY') return 'THE VILLAGE REMEMBERS';
  if (kind === 'WELCOME') return 'A QUIET BEGINNING';
  return 'YOUR RECENT RHYTHM';
}

function stateSentence(state: VillageWorld['environment']['state'], time: VillageWorld['environment']['time_of_day']) {
  const when = time === 'NIGHT' ? 'tonight' : time === 'DAWN' ? 'this morning' : time === 'DUSK' ? 'this evening' : 'today';
  if (state === 'QUIET') return `The village is quiet ${when}`;
  if (state === 'RESTING') return `The village is resting ${when}`;
  if (state === 'PEACEFUL') return `The village feels peaceful ${when}`;
  if (state === 'LIVELY') return `The village feels lively ${when}`;
  return `The village is blooming ${when}`;
}

function eventPlace(event: VillageRewardEvent, buildings: VillageBuilding[]) {
  return buildings.find((building) => building.life_area === event.life_area)?.name ?? label(event.life_area);
}

export function VillageScreen() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const world = useQuery({
    queryKey: ['village'],
    queryFn: async () => (await api.get<VillageWorld>('/village/')).data,
    staleTime: 20_000,
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    if (world.data && selectedKey == null) {
      setSelectedKey(world.data.story.building_key);
    }
  }, [selectedKey, world.data]);

  const selectedBuilding = useMemo(() => {
    if (!world.data) return null;
    return world.data.buildings.find((item) => item.key === selectedKey)
      ?? world.data.buildings.find((item) => item.key === world.data.story.building_key)
      ?? world.data.buildings.find((item) => item.key === 'CENTRAL_TREE')
      ?? world.data.buildings[0];
  }, [world.data, selectedKey]);

  if (world.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!world.data) {
    return <View style={styles.center}><Text style={styles.muted}>The village could not be loaded.</Text></View>;
  }

  const data = world.data;
  const recentEvents = data.recent_events.slice(0, 4);

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>LIVING VILLAGE</Text>
          <Text style={styles.title}>Village</Text>
        </View>
        <Pressable
          onPress={() => world.refetch()}
          accessibilityRole="button"
          accessibilityLabel="Refresh village reflection"
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
        >
          <View style={[styles.refreshDot, world.isFetching && styles.refreshDotActive]} />
          <Text style={styles.refreshText}>{world.isFetching ? 'Listening' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <VillageWorldScene
        world={data}
        selectedKey={selectedBuilding?.key ?? null}
        onSelect={(building) => setSelectedKey(building.key)}
      />

      <View style={styles.reflectionCard}>
        <View style={styles.reflectionTopline}>
          <Text style={styles.storyEyebrow}>{storyEyebrow(data.story.kind)}</Text>
          <Text style={styles.rhythmLabel}>{data.environment.rhythm_score}% recent rhythm</Text>
        </View>
        <Text style={styles.reflectionTitle}>{data.story.title}</Text>
        <Text style={styles.reflectionMessage}>{data.story.message}</Text>
        <View style={styles.environmentLine}>
          <View style={styles.environmentDot} />
          <Text style={styles.environmentText}>{stateSentence(data.environment.state, data.environment.time_of_day)}</Text>
        </View>
      </View>

      {selectedBuilding && <BuildingStory building={selectedBuilding} styles={styles} />}

      <QuietProgress world={data} styles={styles} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>RECENT TRACES</Text>
        <Text style={styles.sectionTitle}>What the village remembers</Text>
        <Text style={styles.muted}>No feed. Just a few real-life actions that became part of the world.</Text>
      </View>

      <Card>
        {recentEvents.length === 0 ? (
          <Text style={styles.muted}>Live your day. The first trace will appear here when something real happens.</Text>
        ) : (
          recentEvents.map((event, index) => (
            <View key={event.id} style={[styles.traceRow, index !== recentEvents.length - 1 && styles.traceBorder]}>
              <View style={styles.traceMarker} />
              <View style={styles.traceCopy}>
                <Text style={styles.traceTitle}>{event.title}</Text>
                <Text style={styles.traceMeta}>{event.date} · {eventPlace(event, data.buildings)}</Text>
              </View>
            </View>
          ))
        )}
      </Card>

      <Text style={styles.principle}>{data.principle}</Text>
    </Screen>
  );
}

function BuildingStory({ building, styles }: { building: VillageBuilding; styles: any }) {
  const progressCopy = building.unlocked
    ? building.xp_to_next_level == null
      ? 'This place has reached its current fullest form.'
      : `${building.xp_to_next_level} more progress until its next visible change.`
    : 'The first real-life action in this area will wake this place.';

  return (
    <View style={styles.buildingCard}>
      <View style={styles.buildingTopline}>
        <View style={styles.buildingIdentity}>
          <Text style={styles.buildingName}>{building.name}</Text>
          <Text style={styles.buildingMeaning}>{building.meaning}</Text>
        </View>
        <View style={styles.stateBadge}>
          <Text style={styles.stateBadgeText}>{building.state_label}</Text>
        </View>
      </View>

      <Text style={styles.growthStory}>{building.growth_story}</Text>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Next visible change</Text>
        <Text style={styles.progressPercent}>{building.progress_percent}%</Text>
      </View>
      <ProgressBar value={building.progress_percent} />
      <Text style={styles.progressCopy}>{progressCopy}</Text>

      <View style={styles.activityNote}>
        <Text style={styles.activityNumber}>{building.recent_actions}</Text>
        <Text style={styles.activityText}>{building.recent_actions === 1 ? 'recent action is visible here' : 'recent actions are visible here'}</Text>
      </View>
    </View>
  );
}

function QuietProgress({ world, styles }: { world: VillageWorld; styles: any }) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionEyebrow}>QUIETLY BECOMING</Text>
          <Text style={styles.progressCardTitle}>Toward {label(world.next_stage.stage)}</Text>
        </View>
        <Text style={styles.bigPercent}>{world.next_stage.progress_percent}%</Text>
      </View>
      <ProgressBar value={world.next_stage.progress_percent} />
      <Text style={styles.muted}>
        {world.next_stage.xp_remaining > 0
          ? `${world.next_stage.xp_remaining} progress remains. There is no deadline.`
          : 'This stage has fully taken shape.'}
      </Text>
      {world.next_unlock && (
        <View style={styles.nextDetail}>
          <View style={styles.nextDetailLine} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nextDetailTitle}>Something new is taking shape</Text>
            <Text style={styles.nextDetailCopy}>{world.next_unlock.xp_remaining} progress away. It will appear naturally.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  screenContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 110, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: 4, paddingTop: 4 },
  headerCopy: { flex: 1 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 31, lineHeight: 35, fontWeight: '800', letterSpacing: -0.7, marginTop: 2 },
  refreshButton: {
    marginTop: 4,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: { opacity: 0.72 },
  refreshDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: colors.surfaceMuted },
  refreshDotActive: { backgroundColor: colors.primary },
  refreshText: { color: colors.text, fontSize: 11, fontWeight: '700' },

  reflectionCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 24,
    padding: 19,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reflectionTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  storyEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.45, flex: 1 },
  rhythmLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  reflectionTitle: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '800', letterSpacing: -0.45, marginTop: 10 },
  reflectionMessage: { color: colors.textMuted, fontSize: 15, lineHeight: 23, marginTop: 8 },
  environmentLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  environmentDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: colors.primary },
  environmentText: { color: colors.text, fontSize: 12, fontWeight: '700' },

  buildingCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 19,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  buildingTopline: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  buildingIdentity: { flex: 1 },
  buildingName: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.35 },
  buildingMeaning: { color: colors.textMuted, lineHeight: 20, marginTop: 2 },
  stateBadge: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  stateBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  growthStory: { color: colors.text, fontSize: 15, lineHeight: 23 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  progressLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  progressPercent: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  progressCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  activityNote: { flexDirection: 'row', alignItems: 'baseline', gap: 7, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  activityNumber: { color: colors.text, fontSize: 22, fontWeight: '800' },
  activityText: { color: colors.textMuted, fontSize: 12 },

  progressCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 24,
    padding: 19,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 11,
  },
  progressCardTop: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  sectionEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  progressCardTitle: { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 4 },
  bigPercent: { color: colors.primary, fontSize: 26, fontWeight: '800' },
  nextDetail: { flexDirection: 'row', alignItems: 'stretch', gap: 11, marginTop: 2 },
  nextDetailLine: { width: 3, borderRadius: 99, backgroundColor: colors.primary },
  nextDetailTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  nextDetailCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 2 },

  sectionHeader: { paddingHorizontal: 4, paddingTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginTop: 4 },
  muted: { color: colors.textMuted, lineHeight: 20 },
  traceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  traceBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  traceMarker: { width: 9, height: 9, borderRadius: 99, backgroundColor: colors.primary, marginTop: 5 },
  traceCopy: { flex: 1 },
  traceTitle: { color: colors.text, fontWeight: '700', lineHeight: 20 },
  traceMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  principle: { color: colors.textMuted, textAlign: 'center', fontSize: 12, lineHeight: 18, paddingHorizontal: 24, paddingTop: 2 },
});
