import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConnectivityStore } from '../offline/network/connectivityStore';
import { useTheme } from '../theme/ThemeContext';
import { WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react-native';

export function OfflineBanner() {
  const { colors } = useTheme();
  const { isInternetReachable, isSyncing, pendingMutationCount } = useConnectivityStore();

  if (isInternetReachable !== false && !isSyncing && pendingMutationCount === 0) {
    return null;
  }

  let icon = <WifiOff size={14} color={colors.textPrimary} />;
  let message = "You're offline. Changes will sync when your connection returns.";
  
  if (isInternetReachable !== false) {
    if (isSyncing) {
      icon = <RefreshCw size={14} color={colors.textPrimary} />;
      message = `Syncing ${pendingMutationCount} changes...`;
    } else if (pendingMutationCount > 0) {
      icon = <AlertCircle size={14} color={colors.textPrimary} />;
      message = `${pendingMutationCount} changes waiting to sync.`;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {icon}
      <Text style={[styles.text, { color: colors.textPrimary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  }
});
