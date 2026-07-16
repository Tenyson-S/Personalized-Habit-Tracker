export const lightColors = {
  background: '#F5F2EA',
  elevatedBackground: '#FFFFFF',
  surface: '#FFFDF8',
  surfaceMuted: '#ECE8DD',
  textPrimary: '#111412',
  textSecondary: '#253128',
  textMuted: '#70776F',
  border: '#DCD8CE',
  primary: '#668061',
  primaryPressed: '#52694E',
  success: '#4CAF50',
  warning: '#F39C12',
  danger: '#9A5D54',
  disabled: '#A5AAA3',
  overlay: 'rgba(17, 20, 18, 0.4)',
  
  ink: '#111412',
  black: '#0A0A0A',
  mint: '#C7F0DB',
  butter: '#FBE8A6',
  primarySoft: '#DFE8E0',
  text: '#111412',
};

export const darkColors = {
  background: '#121212',
  elevatedBackground: '#1E1E1E',
  surface: '#1A1A1A',
  surfaceMuted: '#2C2C2C',
  textPrimary: '#F5F2EA',
  textSecondary: '#E0E0E0',
  textMuted: '#A5AAA3',
  border: '#333333',
  primary: '#85A67F',
  primaryPressed: '#668061',
  success: '#81C784',
  warning: '#FFB74D',
  danger: '#E57373',
  disabled: '#555555',
  overlay: 'rgba(0, 0, 0, 0.6)',
  
  ink: '#F5F2EA',
  black: '#0A0A0A', // Keep pitch black
  mint: '#85A67F',  // Deeper mint
  butter: '#D4B86A', // Deeper butter
  primarySoft: '#2C3A29',
  text: '#F5F2EA',
};

export type ThemeColors = typeof lightColors;

// Deprecated fallback (for components that haven't been refactored yet)
export const colors = lightColors;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 };
export const radius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
};
