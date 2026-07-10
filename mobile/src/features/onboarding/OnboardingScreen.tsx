import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { colors, radius, spacing } from '../../theme/tokens';

const improveOptions = ['Learning', 'Health', 'Sleep', 'Career', 'Mindfulness', 'Creativity', 'Relationships', 'Personal Growth'];
const enjoyOptions = ['Movies', 'Anime', 'Cricket', 'Gaming', 'Drawing', 'Music', 'Going outside', 'Friends', 'Reading for fun'];

function ChoiceGroup({ title, subtitle, options, selected, toggle }: { title: string; subtitle: string; options: string[]; selected: string[]; toggle: (item: string) => void }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.wrap}>
        {options.map((item) => {
          const active = selected.includes(item);
          return (
            <Pressable key={item} onPress={() => toggle(item)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function OnboardingScreen() {
  const queryClient = useQueryClient();
  const [improve, setImprove] = useState<string[]>([]);
  const [enjoy, setEnjoy] = useState<string[]>([]);

  const save = useMutation({
    mutationFn: async () => {
      const interests = [
        ...improve.map((name) => ({ name, type: 'IMPROVE' })),
        ...enjoy.map((name) => ({ name, type: 'ENJOY' })),
      ];
      await Promise.all(interests.map((item) => api.post('/interests/', item)));
      await api.patch('/me/', { profile: { onboarding_completed: true } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
    onError: () => Alert.alert('Could not save', 'Your choices are still yours. Please try once more.'),
  });

  const toggle = (item: string, list: string[], setter: (value: string[]) => void) => setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  return (
    <Screen>
      <Text style={styles.eyebrow}>WELCOME TO VILLAGE</Text>
      <Text style={styles.title}>Tell us what matters. You stay in charge.</Text>
      <ChoiceGroup title="What would you like to care for?" subtitle="Choose any areas you want to notice more clearly." options={improveOptions} selected={improve} toggle={(item) => toggle(item, improve, setImprove)} />
      <ChoiceGroup title="What makes life enjoyable?" subtitle="Hearth may quietly remind you of these after meaningful periods." options={enjoyOptions} selected={enjoy} toggle={(item) => toggle(item, enjoy, setEnjoy)} />
      <Pressable onPress={() => save.mutate()} disabled={save.isPending} style={styles.button}>
        <Text style={styles.buttonText}>{save.isPending ? 'Saving…' : 'Begin my journey'}</Text>
      </Pressable>
      <Text style={styles.footer}>Hearth reflects you. It does not manage you.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  heading: { color: colors.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.textMuted, lineHeight: 21 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99 },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.textMuted },
  chipTextActive: { color: colors.text, fontWeight: '600' },
  button: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { color: 'white', fontWeight: '700' },
  footer: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});
