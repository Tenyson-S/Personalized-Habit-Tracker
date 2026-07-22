import axios from 'axios';
import { mutationQueue, QueuedMutation } from '../queue/mutationQueue';
import { useConnectivityStore } from '../network/connectivityStore';
import { api } from '../../services/api';
import { queryClient } from '../../services/queryClient';
import { useAuthStore } from '../../store/authStore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory or persisted map of local ID to real UUID
const ID_MAP_KEY = 'STEALTHTRACK_ID_MAP';
let idMap: Record<string, string> | null = null;

async function getIdMap(): Promise<Record<string, string>> {
  if (!idMap) {
    const storage = Platform.OS === 'web' && typeof window !== 'undefined' ? window.localStorage : AsyncStorage;
    const stored = await storage.getItem(ID_MAP_KEY);
    idMap = stored ? JSON.parse(stored) : {};
  }
  return idMap!;
}

async function saveIdMap(map: Record<string, string>) {
  idMap = map;
  const storage = Platform.OS === 'web' && typeof window !== 'undefined' ? window.localStorage : AsyncStorage;
  await storage.setItem(ID_MAP_KEY, JSON.stringify(map));
}

function replaceIdsInString(str: string, map: Record<string, string>): string {
  let result = str;
  for (const [localId, realId] of Object.entries(map)) {
    result = result.split(localId).join(realId);
  }
  return result;
}

export async function processSyncQueue(userId: string) {
  const { isSyncing, setSyncing, setPendingCount, isInternetReachable } = useConnectivityStore.getState();

  if (isSyncing || isInternetReachable === false) return;
  setSyncing(true);

  try {
    while (true) {
      const mutations = await mutationQueue.peekMutations(userId, 10);
      if (mutations.length === 0) {
        setPendingCount(0);
        break;
      }

      setPendingCount(mutations.length);

      const map = await getIdMap();

      for (const mutation of mutations) {
        // Replace local IDs with real IDs in URL and Payload
        const url = replaceIdsInString(mutation.url, map);
        const payloadStr = replaceIdsInString(mutation.payload, map);
        const payload = payloadStr ? JSON.parse(payloadStr) : undefined;

        try {
          const auth = useAuthStore.getState();
          const access = auth.tokens?.access;
          const baseURL = api.defaults.baseURL;

          // Use a raw axios instance to bypass our offline interceptors
          const response = await axios({
            method: mutation.method,
            url,
            baseURL,
            data: payload,
            headers: {
              'Idempotency-Key': mutation.idempotencyKey,
              Authorization: `Bearer ${access}`,
            },
          });

          // If this was a creation endpoint, map the local ID to the real UUID
          if (mutation.method.toLowerCase() === 'post' && response.data?.id) {
            if (payload && payload.id && String(payload.id).startsWith('offline-')) {
              map[payload.id] = response.data.id;
              await saveIdMap(map);
            }
          }

          // Successfully synced, remove from queue
          await mutationQueue.removeMutation(mutation.id);
        } catch (error: any) {
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            // Client error — drop to avoid infinite retry loop (bad request won't succeed on retry)
            await mutationQueue.removeMutation(mutation.id);
          } else {
            // Network or server error — stop and retry when connection restores
            throw error;
          }
        }
      }
    }

    // Invalidate everything to refresh with real server IDs
    await queryClient.invalidateQueries();
  } catch {
    // Sync errors are non-fatal — queue will be retried on next connectivity event
  } finally {
    setSyncing(false);

    const remaining = await mutationQueue.peekMutations(userId, 50);
    setPendingCount(remaining.length);
  }
}
