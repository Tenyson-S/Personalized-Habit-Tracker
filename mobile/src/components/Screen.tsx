import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';
import type { ThemeColors } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

export function Screen({ children, contentStyle }: PropsWithChildren<{ contentStyle?: ViewStyle }>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isMobile, rs, contentMaxWidth, horizontalPadding } = useResponsive();

  // Calculate notch / camera / status bar top spacing
  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const topPadding = Math.max(
    insets.top,
    androidStatusHeight,
    isMobile ? 24 : 16
  );

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
            paddingTop: topPadding,
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
  },
});
