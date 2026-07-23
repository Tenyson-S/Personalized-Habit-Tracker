import React, { useState } from 'react';

import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import type {
  CelebrationPreference,
  CelebrationPreferenceCategory,
  CelebrationReflection,
  Chapter,
  MemoryType,
  WorldSnapshot,
} from '../../types/api';
import { ChaptersPanel } from './ChaptersPanel';

const CATEGORIES: { key: CelebrationPreferenceCategory; label: string }[] = [
  { key: 'SMALL_JOY', label: 'Small joy' },
  { key: 'EXPERIENCE', label: 'Experience' },
  { key: 'CONNECTION', label: 'People' },
  { key: 'PLACE', label: 'Place' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function prettyDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function prettyMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function stageLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StoryPanel() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const queryClient = useQueryClient();
  const [memoryDraft, setMemoryDraft] = useState<string | null>(null);

  const weekly = useQuery({
    queryKey: ['celebration', 'WEEKLY'],
    queryFn: async () => (await api.get<CelebrationReflection | null>('/celebrations/current/?period=WEEKLY')).data,
  });
  const monthly = useQuery({
    queryKey: ['celebration', 'MONTHLY'],
    queryFn: async () => (await api.get<CelebrationReflection | null>('/celebrations/current/?period=MONTHLY')).data,
  });
  const preferences = useQuery({
    queryKey: ['celebration-preferences'],
    queryFn: async () => (await api.get<CelebrationPreference[]>('/celebrations/preferences/')).data,
  });
  const history = useQuery({
    queryKey: ['world-history'],
    queryFn: async () => (await api.get<WorldSnapshot[]>('/world-history/')).data,
  });
  const currentChapter = useQuery({
    queryKey: ['chapter-current'],
    queryFn: async () => (await api.get<Chapter | null>('/chapters/current/')).data,
  });

  async function refreshCelebrations() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['celebration'] }),
      queryClient.invalidateQueries({ queryKey: ['celebration-preferences'] }),
    ]);
  }

  if (weekly.isLoading || monthly.isLoading || preferences.isLoading || history.isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.kicker}>YOUR STORY</Text>
        <Text style={styles.introTitle}>Your life, at a glance.</Text>
        <Text style={styles.introBody}>Chapters, memories, and village milestones.</Text>
      </View>

      {memoryDraft ? (
        <CelebrationMemoryComposer
          initialTitle={memoryDraft}
          chapter={currentChapter.data ?? null}
          onCancel={() => setMemoryDraft(null)}
          onCreated={async () => {
            setMemoryDraft(null);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['memories'] }),
              queryClient.invalidateQueries({ queryKey: ['chapters'] }),
              queryClient.invalidateQueries({ queryKey: ['chapter-current'] }),
            ]);
          }}
          styles={styles}
          colors={colors}
        />
      ) : null}

      <ChaptersPanel showIntro={false} />

      {(weekly.data || monthly.data) ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.kicker}>GENTLE PROMPTS</Text>
            <Text style={styles.sectionTitle}>A little joy</Text>
          </View>
          {weekly.data ? <CelebrationCard reflection={weekly.data} onChanged={refreshCelebrations} onRemember={setMemoryDraft} styles={styles} /> : null}
          {monthly.data ? <CelebrationCard reflection={monthly.data} onChanged={refreshCelebrations} onRemember={setMemoryDraft} styles={styles} /> : null}
        </>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>VILLAGE TIMELINE</Text>
        <Text style={styles.sectionTitle}>Milestones</Text>
      </View>
      <WorldHistoryTimeline snapshots={history.data ?? []} styles={styles} />

      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>YOUR PREFERENCES</Text>
        <Text style={styles.sectionTitle}>Things you enjoy</Text>
      </View>
      <PreferenceManager preferences={preferences.data ?? []} onChanged={refreshCelebrations} styles={styles} colors={colors} />
    </View>
  );
}

function CelebrationCard({
  reflection,
  onChanged,
  onRemember,
  styles,
}: {
  reflection: CelebrationReflection;
  onChanged: () => Promise<void>;
  onRemember: (title: string) => void;
  styles: any;
}) {
  const respond = useMutation({
    mutationFn: async ({ status, deactivate = false }: { status: 'MAYBE_LATER' | 'COMPLETED' | 'DISMISSED'; deactivate?: boolean }) => (
      await api.post<CelebrationReflection>(`/celebrations/reflections/${reflection.id}/respond/`, {
        status,
        deactivate_preference: deactivate,
      })
    ).data,
    onSuccess: onChanged,
    onError: () => Alert.alert('Could not update this reflection', 'Nothing was changed. Please try again.'),
  });

  const isWeekly = reflection.period_type === 'WEEKLY';
  const heading = isWeekly ? 'THIS WEEK' : 'THIS MONTH';
  let title = isWeekly ? 'Make room for something you enjoy.' : 'Maybe this month deserves a memory.';
  if (reflection.status === 'COMPLETED') title = 'That happened in your real life.';
  if (reflection.status === 'MAYBE_LATER') title = 'No pressure. It stays your choice.';
  if (reflection.status === 'DISMISSED') title = 'Hearth will stop reflecting this back.';

  return (
    <View style={[styles.celebrationCard, isWeekly ? styles.weeklyCard : styles.monthlyCard]}>
      <View style={styles.celebrationTopline}>
        <Text style={styles.currentEyebrow}>{heading}</Text>
        {reflection.preference_category_label ? <Text style={styles.categoryBadge}>{reflection.preference_category_label}</Text> : null}
      </View>
      <Text style={styles.celebrationTitle}>{title}</Text>
      <Text style={styles.celebrationBody}>{reflection.prompt_text}</Text>

      {reflection.status === 'SUGGESTED' ? (
        <View style={styles.buttonRow}>
          <Pressable style={styles.softButton} disabled={respond.isPending} onPress={() => respond.mutate({ status: 'MAYBE_LATER' })}>
            <Text style={styles.softButtonText}>Maybe later</Text>
          </Pressable>
          <Pressable style={styles.primaryButtonSmall} disabled={respond.isPending} onPress={() => respond.mutate({ status: 'COMPLETED' })}>
            <Text style={styles.primaryButtonText}>I did this</Text>
          </Pressable>
          <Pressable style={styles.textButton} disabled={respond.isPending} onPress={() => respond.mutate({ status: 'DISMISSED', deactivate: true })}>
            <Text style={styles.textButtonText}>Not anymore</Text>
          </Pressable>
        </View>
      ) : null}

      {reflection.status === 'COMPLETED' && reflection.preference_title ? (
        <View style={styles.completedRow}>
          <Text style={styles.completedText}>Hearth did not save this automatically.</Text>
          <Pressable onPress={() => onRemember(reflection.preference_title ?? '')}>
            <Text style={styles.inlineAction}>Keep it as a memory</Text>
          </Pressable>
        </View>
      ) : null}

      {reflection.status === 'MAYBE_LATER' ? <Text style={styles.statusNote}>No reminder was created.</Text> : null}
      {reflection.status === 'DISMISSED' ? <Text style={styles.statusNote}>You can bring it back from your reflection controls below.</Text> : null}
    </View>
  );
}

function CelebrationMemoryComposer({
  initialTitle,
  chapter,
  onCancel,
  onCreated,
  styles,
  colors,
}: {
  initialTitle: string;
  chapter: Chapter | null;
  onCancel: () => void;
  onCreated: () => Promise<void>;
  styles: any;
  colors: ThemeColors;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MemoryType>('EXPERIENCE');

  const createMemory = useMutation({
    mutationFn: async () => api.post('/memories/', {
      chapter: chapter?.id ?? null,
      title: title.trim(),
      description: description.trim(),
      memory_type: type,
      happened_on: todayIso(),
    }),
    onSuccess: onCreated,
    onError: () => Alert.alert('Could not keep this memory', 'Nothing was lost. Please try again.'),
  });

  return (
    <Card>
      <Text style={styles.formTitle}>Keep it only if it matters to you</Text>
      <Text style={styles.muted}>This happened outside the app. Saving it remains your choice.</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} maxLength={140} placeholder="What do you want to call this memory?" placeholderTextColor={colors.textMuted} />
      <TextInput value={description} onChangeText={setDescription} style={[styles.input, styles.multiline]} multiline maxLength={1200} placeholder="A few words for your future self" placeholderTextColor={colors.textMuted} />
      <View style={styles.choiceWrap}>
        {(['MOMENT', 'EXPERIENCE', 'PEOPLE'] as MemoryType[]).map((item) => (
          <Pressable key={item} onPress={() => setType(item)} style={[styles.choiceChip, type === item && styles.choiceChipActive]}>
            <Text style={type === item ? styles.choiceTextActive : styles.choiceText}>{item.replace('_', ' ').toLowerCase()}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={styles.primaryButtonSmall} disabled={!title.trim() || createMemory.isPending} onPress={() => createMemory.mutate()}>
          <Text style={styles.primaryButtonText}>{createMemory.isPending ? 'Keeping…' : 'Keep this memory'}</Text>
        </Pressable>
        <Pressable style={styles.softButton} onPress={onCancel}><Text style={styles.softButtonText}>Not now</Text></Pressable>
      </View>
    </Card>
  );
}

function WorldHistoryTimeline({ snapshots, styles }: { snapshots: WorldSnapshot[]; styles: any }) {
  if (snapshots.length === 0) {
    return (
      <Card>
        <Text style={styles.muted}>World history begins after a chapter closes or a full month of life becomes part of the past.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.timeline}>
      {snapshots.slice(0, 8).map((snapshot, index) => {
        const visiblePlaces = snapshot.building_states.filter((building) => building.visible).length;
        const label = snapshot.snapshot_type === 'MONTHLY' ? prettyMonth(snapshot.period_key) : snapshot.chapter_title ?? prettyDate(snapshot.captured_on);
        return (
          <View key={snapshot.id} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={styles.timelineDot} />
              {index < Math.min(snapshots.length, 8) - 1 ? <View style={styles.timelineLine} /> : null}
            </View>
            <View style={styles.historyCard}>
              <View style={styles.historyTopline}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentEyebrow}>{snapshot.snapshot_type_label}</Text>
                  <Text style={styles.historyTitle}>{label}</Text>
                </View>
                <Text style={styles.stageBadge}>{stageLabel(snapshot.village_stage)}</Text>
              </View>
              <Text style={styles.historySummary}>{snapshot.summary}</Text>
              <Text style={styles.historyMeta}>{visiblePlaces} places visible · {snapshot.unlocks.length} quiet surprises appeared</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PreferenceManager({ preferences, onChanged, styles, colors }: { preferences: CelebrationPreference[]; onChanged: () => Promise<void>; styles: any; colors: ThemeColors }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CelebrationPreferenceCategory>('SMALL_JOY');

  const create = useMutation({
    mutationFn: async () => api.post('/celebrations/preferences/', { title: title.trim(), category, note: '' }),
    onSuccess: async () => {
      setTitle('');
      setShowForm(false);
      await onChanged();
    },
    onError: () => Alert.alert('Could not add this', 'It may already be in your list.'),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/celebrations/preferences/${id}/`, { is_active: isActive }),
    onSuccess: onChanged,
    onError: () => Alert.alert('Could not update this choice', 'Nothing was changed.'),
  });

  return (
    <View style={styles.preferenceCard}>
      <Text style={styles.muted}>Hearth only reflects things that came from you. Pause anything that no longer feels like you.</Text>
      <View style={styles.preferenceList}>
        {preferences.map((preference) => (
          <View key={preference.id} style={styles.preferenceRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.preferenceTitle, !preference.is_active && styles.preferenceInactive]}>{preference.title}</Text>
              <Text style={styles.preferenceMeta}>{preference.category_label}{preference.is_active ? '' : ' · paused'}</Text>
            </View>
            <Pressable onPress={() => toggle.mutate({ id: preference.id, isActive: !preference.is_active })}>
              <Text style={styles.inlineAction}>{preference.is_active ? 'Pause' : 'Bring back'}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {!showForm ? (
        <Pressable style={styles.softButtonWide} onPress={() => setShowForm(true)}><Text style={styles.softButtonText}>Add something I enjoy</Text></Pressable>
      ) : (
        <View style={styles.preferenceForm}>
          <TextInput value={title} onChangeText={setTitle} style={styles.input} maxLength={100} placeholder="Example: Long drives" placeholderTextColor={colors.textMuted} />
          <View style={styles.choiceWrap}>
            {CATEGORIES.map((item) => (
              <Pressable key={item.key} onPress={() => setCategory(item.key)} style={[styles.choiceChip, category === item.key && styles.choiceChipActive]}>
                <Text style={category === item.key ? styles.choiceTextActive : styles.choiceText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.buttonRow}>
            <Pressable style={styles.primaryButtonSmall} disabled={!title.trim() || create.isPending} onPress={() => create.mutate()}>
              <Text style={styles.primaryButtonText}>Add quietly</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => setShowForm(false)}><Text style={styles.softButtonText}>Cancel</Text></Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: spacing.md },
  intro: { gap: 6, paddingVertical: 4 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  introTitle: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '800', letterSpacing: -0.4 },
  introBody: { color: colors.textMuted, lineHeight: 21 },
  sectionHeader: { gap: 4, paddingTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 21, lineHeight: 26, fontWeight: '800' },
  muted: { color: colors.textMuted, lineHeight: 21 },
  celebrationCard: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 12 },
  weeklyCard: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  monthlyCard: { backgroundColor: colors.surface, borderColor: colors.border },
  celebrationTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  currentEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  categoryBadge: { color: colors.textMuted, fontSize: 10, backgroundColor: colors.background, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  celebrationTitle: { color: colors.text, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  celebrationBody: { color: colors.text, fontSize: 16, lineHeight: 23 },
  buttonRow: { flexDirection: 'row', gap: 9, flexWrap: 'wrap', alignItems: 'center' },
  primaryButtonSmall: { flexGrow: 1, minWidth: 135, backgroundColor: colors.primary, borderRadius: radius.md, padding: 13, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  softButton: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 13, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface },
  softButtonWide: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 13, alignItems: 'center', backgroundColor: colors.surface },
  softButtonText: { color: colors.textMuted, fontWeight: '700' },
  textButton: { paddingHorizontal: 4, paddingVertical: 10 },
  textButtonText: { color: colors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
  completedRow: { gap: 4, paddingTop: 4 },
  completedText: { color: colors.textMuted, fontSize: 12 },
  inlineAction: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  statusNote: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  formTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, color: colors.text, fontSize: 15 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: colors.surface },
  choiceChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  choiceText: { color: colors.textMuted, fontSize: 12, textTransform: 'capitalize' },
  choiceTextActive: { color: colors.text, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineRail: { width: 16, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 99, backgroundColor: colors.primary, marginTop: 22 },
  timelineLine: { width: 1, flex: 1, minHeight: 36, backgroundColor: colors.border },
  historyCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 17, gap: 9, marginBottom: 12 },
  historyTopline: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  historyTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 3 },
  stageBadge: { color: colors.primary, fontSize: 10, fontWeight: '800', backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  historySummary: { color: colors.text, lineHeight: 21 },
  historyMeta: { color: colors.textMuted, fontSize: 10 },
  preferenceCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 18, gap: 14 },
  preferenceList: { gap: 0 },
  preferenceRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  preferenceTitle: { color: colors.text, fontWeight: '800' },
  preferenceInactive: { color: colors.textMuted },
  preferenceMeta: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  preferenceForm: { gap: 12 },
});
