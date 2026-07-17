import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';
import type { ThemeColors } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

export function Screen({ children, contentStyle }: PropsWithChildren<{ contentStyle?: ViewStyle }>) {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 80 + Math.max(insets.bottom, 12) }, contentStyle]}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, width: '100%', maxWidth: 720, alignSelf: 'center' },
});
