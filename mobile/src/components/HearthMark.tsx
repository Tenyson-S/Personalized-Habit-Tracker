import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export function HearthMark({ size = 64, color = '#111412', accent = '#8BA783' }: { size?: number; color?: string; accent?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityRole="image" accessibilityLabel="Hearth mark">
      <Path d="M15 50V29c0-11 7.5-19 17-19s17 8 17 19v21" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <Path d="M23 50h18" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <Path d="M31.8 44c-7 0-10.5-4.7-9.6-10.5 5.6.1 9.6 2.8 10.6 7.6.4-7.5 4.2-12.7 10-14.4 1.8 8.2-1.6 15.2-11 17.3Z" fill={accent} />
      <Circle cx="32" cy="18" r="2.4" fill={color} />
    </Svg>
  );
}
