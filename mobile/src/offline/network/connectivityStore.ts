import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAuthStore } from '../../store/authStore';

type ConnectivityState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  lastOnlineAt: Date | null;
  connectionType: string | null;
  isSyncing: boolean;
  pendingMutationCount: number;
  
  setSyncing: (isSyncing: boolean) => void;
  setPendingCount: (count: number) => void;
  initConnectivityListener: () => () => void;
};

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  isConnected: true, // Optimistically assume true
  isInternetReachable: true,
  lastOnlineAt: new Date(),
  connectionType: null,
  isSyncing: false,
  pendingMutationCount: 0,

  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (count) => set({ pendingMutationCount: count }),

  initConnectivityListener: () => {
    return NetInfo.addEventListener((state: NetInfoState) => {
      const wasReachable = get().isInternetReachable;
      const isReachable = state.isInternetReachable ?? state.isConnected;

      set({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });

      if (isReachable) {
        set({ lastOnlineAt: new Date() });
        // If we just came online and we are authenticated, we should trigger a sync
        if (wasReachable === false) {
          const auth = useAuthStore.getState();
          if (auth.tokens && auth.userId) {
            const { processSyncQueue } = require('../sync/syncEngine');
            processSyncQueue(auth.userId);
          }
        }
      }
    });
  }
}));
