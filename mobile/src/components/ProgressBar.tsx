import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';

export function ProgressBar({ value }: { value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`;
  return <View style={styles.track}><View style={[styles.fill, { width }]} /></View>;
}

const styles = StyleSheet.create({
  track: { height: 10, backgroundColor: colors.surfaceMuted, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 99 },
});
