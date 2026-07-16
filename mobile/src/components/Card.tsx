import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '../theme/tokens';
import type { ThemeColors } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

export function Card({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  return <View style={styles.card}>{children}</View>;
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
