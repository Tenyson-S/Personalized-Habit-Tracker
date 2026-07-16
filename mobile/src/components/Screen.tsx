import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';
import type { ThemeColors } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

export function Screen({ children, contentStyle }: PropsWithChildren<{ contentStyle?: ViewStyle }>) {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 96, gap: spacing.md },
});
