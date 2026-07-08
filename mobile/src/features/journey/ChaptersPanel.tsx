import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { colors, radius, spacing } from '../../theme/tokens';
import type { Chapter, LifeArea, Memory, MemoryType } from '../../types/api';

const LIFE_AREAS: { key: LifeArea; label: string }[] = [
  { key: 'LEARNING', label: 'Learning' },
  { key: 'CAREER', label: 'Career' },
  { key: 'HEALTH', label: 'Health' },
  { key: 'SLEEP', label: 'Sleep' },
  { key: 'MINDFULNESS', label: 'Mindfulness' },
  { key: 'CREATIVITY', label: 'Creativity' },
  { key: 'RELATIONSHIPS', label: 'Relationships' },
  { key: 'PERSONAL_GROWTH', label: 'Personal growth' },
];

const MEMORY_TYPES: { key: MemoryType; label: string }[] = [
  { key: 'MOMENT', label: 'Moment' },
  { key: 'MILESTONE', label: 'Milestone' },
  { key: 'PEOPLE', label: 'People' },
  { key: 'EXPERIENCE', label: 'Experience' },
  { key: 'PERSONAL_CHANGE', label: 'Personal change' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function prettyDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function sleepText(minutes: number | null) {
  if (minutes == null) return 'No record';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ChaptersPanel({ showIntro = true }: { showIntro?: boolean }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showMemory, setShowMemory] = useState(false);

  const current = useQuery({
    queryKey: ['chapter-current'],
    queryFn: async () => (await api.get<Chapter | null>('/chapters/current/')).data,
  });
  const chapters = useQuery({
    queryKey: ['chapters'],
    queryFn: async () => (await api.get<Chapter[]>('/chapters/')).data,
  });
  const memories = useQuery({
    queryKey: ['memories'],
    queryFn: async () => (await api.get<Memory[]>('/memories/')).data,
  });

  const closedChapters = useMemo(
    () => (chapters.data ?? []).filter((chapter) => chapter.status === 'CLOSED'),
    [chapters.data],
  );

  async function refreshStory() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['chapter-current'] }),
      queryClient.invalidateQueries({ queryKey: ['chapters'] }),
      queryClient.invalidateQueries({ queryKey: ['memories'] }),
      queryClient.invalidateQueries({ queryKey: ['village'] }),
    ]);
  }

  if (current.isLoading || chapters.isLoading || memories.isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      {showIntro ? (
        <View style={styles.intro}>
          <Text style={styles.kicker}>LIFE CHAPTERS</Text>
          <Text style={styles.introTitle}>Give this season a name.</Text>
          <Text style={styles.introBody}>A chapter is context, not a deadline. It helps Village remember what mattered during this part of your life.</Text>
        </View>
      ) : null}

      {current.data ? (
        <>
          <CurrentChapterCard
            chapter={current.data}
            onAddMemory={() => setShowMemory((value) => !value)}
            onClosed={refreshStory}
          />
          {showMemory && <MemoryComposer chapter={current.data} onCreated={async () => { setShowMemory(false); await refreshStory(); }} />}
        </>
      ) : (
        <>
          {!showCreate ? (
            <View style={styles.emptyChapter}>
              <Text style={styles.emptyEyebrow}>NO ACTIVE CHAPTER</Text>
              <Text style={styles.emptyTitle}>You do not need a new plan. Just name the season you are in.</Text>
              <Text style={styles.emptyBody}>Examples: Becoming job ready, First months at work, Returning to health, Building something of my own.</Text>
              <Pressable style={styles.primaryButton} onPress={() => setShowCreate(true)}>
                <Text style={styles.primaryButtonText}>Begin a chapter</Text>
              </Pressable>
            </View>
          ) : (
            <ChapterComposer onCreated={async () => { setShowCreate(false); await refreshStory(); }} onCancel={() => setShowCreate(false)} />
          )}
        </>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>MEMORIES</Text>
        <Text style={styles.sectionTitle}>Moments you chose to keep</Text>
      </View>
      {(memories.data ?? []).length === 0 ? (
        <Card>
          <Text style={styles.cardBody}>No memories saved yet. Village will not decide what is important for you.</Text>
        </Card>
      ) : (
        (memories.data ?? []).slice(0, 5).map((memory) => <MemoryCard key={memory.id} memory={memory} />)
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>PAST CHAPTERS</Text>
        <Text style={styles.sectionTitle}>Parts of your life that already happened</Text>
      </View>
      {closedChapters.length === 0 ? (
        <Card><Text style={styles.cardBody}>Closed chapters will become a quiet archive here.</Text></Card>
      ) : (
        closedChapters.map((chapter) => <ClosedChapterCard key={chapter.id} chapter={chapter} />)
      )}
    </View>
  );
}

function CurrentChapterCard({ chapter, onAddMemory, onClosed }: { chapter: Chapter; onAddMemory: () => void; onClosed: () => Promise<void> }) {
  const closeChapter = useMutation({
    mutationFn: async () => (await api.post<Chapter>(`/chapters/${chapter.id}/close/`, {})).data,
    onSuccess: onClosed,
    onError: () => Alert.alert('Could not close this chapter', 'Nothing was changed. Please try again.'),
  });

  function confirmClose() {
    Alert.alert(
      'Close this chapter?',
      'The chapter will become part of your history. Your habits, tasks, memories, and village progress stay exactly where they are.',
      [
        { text: 'Keep living it', style: 'cancel' },
        { text: 'Close chapter', onPress: () => closeChapter.mutate() },
      ],
    );
  }

  return (
    <View style={styles.currentCard}>
      <View style={styles.currentTopline}>
        <Text style={styles.currentEyebrow}>CURRENT CHAPTER</Text>
        <Text style={styles.dayBadge}>Day {chapter.days_lived}</Text>
      </View>
      <Text style={styles.currentTitle}>{chapter.title}</Text>
      {chapter.intention ? <Text style={styles.currentIntention}>"{chapter.intention}"</Text> : null}
      <View style={styles.focusRow}>
        {chapter.focuses.map((focus) => <View key={focus.id} style={styles.focusChip}><Text style={styles.focusChipText}>{focus.life_area_label}</Text></View>)}
      </View>
      <View style={styles.statsRow}>
        <Stat value={chapter.retrospective.active_days} label="active days" />
        <Stat value={chapter.retrospective.tasks_completed} label="tasks" />
        <Stat value={chapter.retrospective.memories_saved} label="memories" />
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={styles.primaryButtonSmall} onPress={onAddMemory}><Text style={styles.primaryButtonText}>Save a memory</Text></Pressable>
        <Pressable style={styles.ghostButton} onPress={confirmClose} disabled={closeChapter.isPending}><Text style={styles.ghostButtonText}>{closeChapter.isPending ? 'Closing…' : 'Close chapter'}</Text></Pressable>
      </View>
    </View>
  );
}

function ChapterComposer({ onCreated, onCancel }: { onCreated: () => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [intention, setIntention] = useState('');
  const [areas, setAreas] = useState<LifeArea[]>([]);

  const createChapter = useMutation({
    mutationFn: async () => api.post('/chapters/', {
      title: title.trim(),
      intention: intention.trim(),
      start_date: todayIso(),
      focus_areas: areas,
    }),
    onSuccess: onCreated,
    onError: (error: any) => Alert.alert('Could not begin this chapter', error?.response?.data?.detail ?? 'Nothing was changed. Please try again.'),
  });

  function toggleArea(area: LifeArea) {
    setAreas((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area]);
  }

  return (
    <Card>
      <Text style={styles.formTitle}>Begin a chapter</Text>
      <Text style={styles.formHint}>Name the part of life you are already living.</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Example: Becoming job ready" style={styles.input} maxLength={120} />
      <TextInput value={intention} onChangeText={setIntention} placeholder="What do you hope this chapter becomes?" style={[styles.input, styles.multiline]} multiline maxLength={500} />
      <Text style={styles.fieldLabel}>WHAT MATTERS IN THIS CHAPTER</Text>
      <View style={styles.choiceWrap}>
        {LIFE_AREAS.map((item) => (
          <Pressable key={item.key} onPress={() => toggleArea(item.key)} style={[styles.choiceChip, areas.includes(item.key) && styles.choiceChipActive]}>
            <Text style={areas.includes(item.key) ? styles.choiceTextActive : styles.choiceText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={styles.primaryButtonSmall} disabled={!title.trim() || createChapter.isPending} onPress={() => createChapter.mutate()}>
          <Text style={styles.primaryButtonText}>{createChapter.isPending ? 'Beginning…' : 'Begin quietly'}</Text>
        </Pressable>
        <Pressable style={styles.ghostButton} onPress={onCancel}><Text style={styles.ghostButtonText}>Not now</Text></Pressable>
      </View>
    </Card>
  );
}

function MemoryComposer({ chapter, onCreated }: { chapter: Chapter; onCreated: () => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MemoryType>('MOMENT');

  const createMemory = useMutation({
    mutationFn: async () => api.post('/memories/', {
      chapter: chapter.id,
      title: title.trim(),
      description: description.trim(),
      memory_type: type,
      happened_on: todayIso(),
    }),
    onSuccess: onCreated,
    onError: () => Alert.alert('Could not save this memory', 'Nothing was lost. Please try again.'),
  });

  return (
    <Card>
      <Text style={styles.formTitle}>Keep this moment</Text>
      <Text style={styles.formHint}>Village stores it because you chose to remember it.</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="What happened?" style={styles.input} maxLength={140} />
      <TextInput value={description} onChangeText={setDescription} placeholder="A few words for your future self" style={[styles.input, styles.multiline]} multiline maxLength={1200} />
      <View style={styles.choiceWrap}>
        {MEMORY_TYPES.map((item) => (
          <Pressable key={item.key} onPress={() => setType(item.key)} style={[styles.choiceChip, type === item.key && styles.choiceChipActive]}>
            <Text style={type === item.key ? styles.choiceTextActive : styles.choiceText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.primaryButton} disabled={!title.trim() || createMemory.isPending} onPress={() => createMemory.mutate()}>
        <Text style={styles.primaryButtonText}>{createMemory.isPending ? 'Keeping…' : 'Keep this memory'}</Text>
      </Pressable>
    </Card>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <View style={styles.memoryCard}>
      <View style={styles.memoryLine} />
      <View style={{ flex: 1 }}>
        <View style={styles.memoryTopline}>
          <Text style={styles.memoryType}>{memory.memory_type_label}</Text>
          <Text style={styles.memoryDate}>{prettyDate(memory.happened_on)}</Text>
        </View>
        <Text style={styles.memoryTitle}>{memory.title}</Text>
        {memory.description ? <Text style={styles.memoryBody}>{memory.description}</Text> : null}
        {memory.chapter_title ? <Text style={styles.memoryChapter}>From "{memory.chapter_title}"</Text> : null}
      </View>
    </View>
  );
}

function ClosedChapterCard({ chapter }: { chapter: Chapter }) {
  return (
    <View style={styles.closedCard}>
      <View style={styles.closedTopline}>
        <View style={{ flex: 1 }}>
          <Text style={styles.closedDate}>{prettyDate(chapter.start_date)} — {chapter.end_date ? prettyDate(chapter.end_date) : 'Present'}</Text>
          <Text style={styles.closedTitle}>{chapter.title}</Text>
        </View>
        <Text style={styles.closedDays}>{chapter.retrospective.duration_days} days</Text>
      </View>
      <Text style={styles.closedReflection}>{chapter.reflection}</Text>
      <View style={styles.closedStats}>
        <Text style={styles.closedStat}>{chapter.retrospective.active_days} active days</Text>
        <Text style={styles.closedStat}>{chapter.retrospective.memories_saved} memories</Text>
        <Text style={styles.closedStat}>Avg rest {sleepText(chapter.retrospective.average_sleep_minutes)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  intro: { gap: 6, paddingVertical: 4 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  introTitle: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '800', letterSpacing: -0.4 },
  introBody: { color: colors.textMuted, lineHeight: 21 },
  currentCard: { backgroundColor: '#E7EBDD', borderRadius: 26, borderWidth: 1, borderColor: '#D4DBC9', padding: 20, gap: 14 },
  currentTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  currentEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  dayBadge: { color: colors.primary, backgroundColor: '#F7F8F1', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '800' },
  currentTitle: { color: colors.text, fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.6 },
  currentIntention: { color: '#536052', fontSize: 16, lineHeight: 23, fontStyle: 'italic' },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  focusChip: { backgroundColor: '#F8F8F2', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#D8DECF' },
  focusChipText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.58)', borderRadius: 16, padding: 12, minHeight: 74 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  buttonRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  primaryButtonSmall: { flex: 1, minWidth: 145, backgroundColor: colors.primary, borderRadius: radius.md, padding: 13, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  ghostButton: { flex: 1, minWidth: 120, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 13, alignItems: 'center', backgroundColor: colors.surface },
  ghostButtonText: { color: colors.textMuted, fontWeight: '700' },
  emptyChapter: { backgroundColor: colors.surface, borderRadius: 26, borderWidth: 1, borderColor: colors.border, padding: 22, gap: 12 },
  emptyEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  emptyTitle: { color: colors.text, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  emptyBody: { color: colors.textMuted, lineHeight: 21 },
  formTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  formHint: { color: colors.textMuted, lineHeight: 20 },
  fieldLabel: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, color: colors.text, fontSize: 15 },
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: colors.surface },
  choiceChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  choiceText: { color: colors.textMuted, fontSize: 12 },
  choiceTextActive: { color: colors.text, fontSize: 12, fontWeight: '800' },
  sectionHeader: { gap: 4, paddingTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 21, lineHeight: 26, fontWeight: '800' },
  cardBody: { color: colors.textMuted, lineHeight: 21 },
  memoryCard: { flexDirection: 'row', gap: 13, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 17 },
  memoryLine: { width: 3, borderRadius: 99, backgroundColor: '#8A9B75' },
  memoryTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  memoryType: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  memoryDate: { color: colors.textMuted, fontSize: 10 },
  memoryTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 7 },
  memoryBody: { color: colors.textMuted, lineHeight: 21, marginTop: 5 },
  memoryChapter: { color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 10 },
  closedCard: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 11 },
  closedTopline: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  closedDate: { color: colors.textMuted, fontSize: 10 },
  closedTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 3 },
  closedDays: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  closedReflection: { color: colors.text, lineHeight: 21 },
  closedStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  closedStat: { color: colors.textMuted, fontSize: 10, backgroundColor: colors.background, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
});
