import React from 'react';
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { colors, radius, spacing, fonts } from '../../theme/tokens';
import { AppText } from './AppText';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function AppInput({ label, error, style, ...props }: AppInputProps) {
  return (
    <View style={styles.container}>
      {label && <AppText variant="bodySm" weight="semiBold" style={styles.label}>{label}</AppText>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <AppText variant="caption" color={colors.danger} style={styles.error}>{error}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: spacing.xs,
  },
});
