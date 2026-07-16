import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  isLoading?: boolean;
}

export function AppButton({ label, variant = 'primary', isLoading, style, disabled, ...props }: AppButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return colors.disabled;
    if (variant === 'primary') return colors.primary;
    if (variant === 'secondary') return colors.surfaceMuted;
    if (variant === 'outline' || variant === 'text') return 'transparent';
    return colors.primary;
  };

  const getTextColor = () => {
    if (disabled && variant !== 'primary') return colors.disabled;
    if (variant === 'primary') return '#FFFFFF';
    if (variant === 'outline') return colors.primary;
    if (variant === 'text') return colors.primary;
    return colors.textPrimary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || isLoading}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <AppText weight="bold" color={getTextColor()} style={styles.label}>
          {label}
        </AppText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
  },
});
