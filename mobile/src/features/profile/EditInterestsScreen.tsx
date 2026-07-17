import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { api } from '../../services/api';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import type { Interest, InterestType } from '../../types/api';

export function EditInterestsScreen() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  
  const { data: interests = [], isLoading } = useQuery({
    queryKey: ['interests'],
    queryFn: async () => (await api.get<Interest[]>('/interests/')).data,
  });

  const [newImprove, setNewImprove] = useState('');
  const [newEnjoy, setNewEnjoy] = useState('');
  const [newCareAbout, setNewCareAbout] = useState('');

  const addMutation = useMutation({
    mutationFn: async (payload: { name: string, type: InterestType }) => {
      await api.post('/interests/', payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interests'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/interests/${id}/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interests'] }),
  });

  const handleAdd = (type: InterestType) => {
    let value = '';
    if (type === 'IMPROVE') value = newImprove;
    else if (type === 'ENJOY') value = newEnjoy;
    else if (type === 'CARE_ABOUT') value = newCareAbout;
    
    if (!value.trim()) return;
    
    addMutation.mutate({ name: value.trim(), type });
    if (type === 'IMPROVE') setNewImprove('');
    else if (type === 'ENJOY') setNewEnjoy('');
    else if (type === 'CARE_ABOUT') setNewCareAbout('');
  };

  if (isLoading) return <Screen><ActivityIndicator /></Screen>;

  const improves = interests.filter(i => i.type === 'IMPROVE');
  const enjoys = interests.filter(i => i.type === 'ENJOY');
  const cares = interests.filter(i => i.type === 'CARE_ABOUT');

  return (
    <Screen contentStyle={styles.scroll}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      
      <Text style={styles.title}>Life Areas & Interests</Text>
      <Text style={styles.body}>We use these to help categorize your habits and tasks automatically.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Things I want to improve</Text>
        <Text style={styles.sectionDesc}>Areas of your life you are actively working on (e.g. "Health", "Career").</Text>
        <View style={styles.tagsContainer}>
          {improves.map(item => (
            <View key={item.id} style={styles.tag}>
              <Text style={styles.tagText}>{item.name}</Text>
              <Pressable onPress={() => deleteMutation.mutate(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput 
            style={styles.input} 
            value={newImprove} 
            onChangeText={setNewImprove} 
            placeholder="Add new area..." 
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => handleAdd('IMPROVE')}
          />
          <Pressable onPress={() => handleAdd('IMPROVE')} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Things I enjoy</Text>
        <Text style={styles.sectionDesc}>Hobbies or activities you do for fun and rest.</Text>
        <View style={styles.tagsContainer}>
          {enjoys.map(item => (
            <View key={item.id} style={styles.tag}>
              <Text style={styles.tagText}>{item.name}</Text>
              <Pressable onPress={() => deleteMutation.mutate(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput 
            style={styles.input} 
            value={newEnjoy} 
            onChangeText={setNewEnjoy} 
            placeholder="Add new hobby..." 
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => handleAdd('ENJOY')}
          />
          <Pressable onPress={() => handleAdd('ENJOY')} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Things I care about</Text>
        <Text style={styles.sectionDesc}>People, causes, or values important to you.</Text>
        <View style={styles.tagsContainer}>
          {cares.map(item => (
            <View key={item.id} style={styles.tag}>
              <Text style={styles.tagText}>{item.name}</Text>
              <Pressable onPress={() => deleteMutation.mutate(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput 
            style={styles.input} 
            value={newCareAbout} 
            onChangeText={setNewCareAbout} 
            placeholder="Add value or cause..." 
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => handleAdd('CARE_ABOUT')}
          />
          <Pressable onPress={() => handleAdd('CARE_ABOUT')} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>

    </Screen>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  scroll: { paddingBottom: 100 },
  backButton: { marginBottom: spacing.lg, paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontWeight: '600', fontSize: 16 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: spacing.sm },
  body: { color: colors.textMuted, fontSize: 16, marginBottom: spacing.xl, lineHeight: 22 },
  
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  sectionDesc: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.md },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 99, paddingLeft: 12, paddingRight: 4, paddingVertical: 4 },
  tagText: { color: colors.text, fontSize: 14, fontWeight: '500', marginRight: 4 },
  deleteBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.textMuted, fontSize: 14, fontWeight: 'bold', lineHeight: 16 },
  
  addRow: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: 14 },
  addButton: { backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  addButtonText: { color: colors.primary, fontWeight: '700' },
});
