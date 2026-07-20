import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';
import type { ThemeColors } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

export function Screen({ children, contentStyle }: PropsWithChildren<{ contentStyle?: ViewStyle }>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { rs, contentMaxWidth, horizontalPadding } = useResponsive();

  const paddingBottom = rs(
    80 + Math.max(insets.bottom, 12),  // mobile: clear bottom tab bar
    80 + Math.max(insets.bottom, 12),  // tablet: same
    40,                                 // desktop: side nav, less bottom padding needed
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom,
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
          },
          contentStyle,
        ]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    gap: spacing.md,
    width: '100%',
    alignSelf: 'center',
    paddingTop: spacing.md,
  },
});
