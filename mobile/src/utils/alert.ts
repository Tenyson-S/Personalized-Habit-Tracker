import { Alert, Platform } from 'react-native';

export function showAlert(title: string, message?: string, onPress?: () => void) {
  if (Platform.OS === 'web') {
    const fullMsg = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined') {
      window.alert(fullMsg);
    }
    if (onPress) onPress();
  } else {
    Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : undefined);
  }
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'OK',
  cancelText: string = 'Cancel'
) {
  if (Platform.OS === 'web') {
    const fullMsg = `${title}\n\n${message}`;
    if (typeof window !== 'undefined' && window.confirm(fullMsg)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
