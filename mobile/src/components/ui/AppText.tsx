import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption';
  color?: string;
  weight?: keyof typeof fonts;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function AppText({ variant = 'body', color = colors.textPrimary, weight, align, style, ...props }: AppTextProps) {
  const getFontSize = () => {
    switch (variant) {
      case 'h1': return 32;
      case 'h2': return 24;
      case 'h3': return 20;
      case 'body': return 16;
      case 'bodySm': return 14;
      case 'caption': return 12;
    }
  };

  const getFontFamily = () => {
    if (weight) return fonts[weight];
    if (variant === 'h1' || variant === 'h2' || variant === 'h3') return fonts.bold;
    return fonts.regular;
  };

  return (
    <Text
      style={[
        {
          fontSize: getFontSize(),
          fontFamily: getFontFamily(),
          color,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    />
  );
}
