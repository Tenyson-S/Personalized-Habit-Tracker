import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

export function AppCard({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.elevatedBackground,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
