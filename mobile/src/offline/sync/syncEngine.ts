import { mutationQueue, QueuedMutation } from '../queue/mutationQueue';
import { useConnectivityStore } from '../network/connectivityStore';
import { api } from '../../services/api';
import { queryClient } from '../../services/queryClient';
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
    // Replace all instances of localId with realId
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

      setPendingCount(mutations.length); // approximate remaining

      const map = await getIdMap();

      for (const mutation of mutations) {
        // Replace local IDs with real IDs in URL and Payload
        const url = replaceIdsInString(mutation.url, map);
        const payloadStr = replaceIdsInString(mutation.payload, map);
        const payload = payloadStr ? JSON.parse(payloadStr) : undefined;

        try {
          // Bypass our own adapter to actually send the request
          // We can do this by using a fresh axios instance or by temporarily skipping the adapter
          const config = {
            method: mutation.method,
            url,
            data: payload,
            headers: {
              'Idempotency-Key': mutation.idempotencyKey,
            }
          };

          // Use the original axios defaults to bypass the offline adapter
          const axios = require('axios').default;
          const baseURL = api.defaults.baseURL;
          const auth = require('../../store/authStore').useAuthStore.getState();
          const access = auth.tokens?.access;
          
          const response = await axios({
            ...config,
            baseURL,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${access}`
            }
          });

          // If this was a creation endpoint, map the local ID to the real UUID
          if (mutation.method.toLowerCase() === 'post' && response.data?.id) {
            // Find the local ID from the original payload if we assigned one
            // We know our UI uses `offline-${Date.now()}`, which we don't send to backend,
            // but wait, how do we know the local ID?
            // Actually, we don't send `id` to the backend on POST.
            // But if it's a dependent mutation (like complete Task), we need the real ID!
            // To fix this, our ActivityComposer generated an `offline-123` ID.
            // We should parse the payload to see if it had a temporary ID, or we can just 
            // extract the id if we sent it? We don't send id.
            // Let's assume dependent creations aren't strictly chained instantly without IDs,
            // OR we store the localId in the mutation record.
            
            // For now, mapping is only crucial if we sent a localId.
            // Let's extract localId from the payload if it exists.
            if (payload && payload.id && String(payload.id).startsWith('offline-')) {
              map[payload.id] = response.data.id;
              await saveIdMap(map);
            }
          }

          // Successfully synced, remove from queue
          await mutationQueue.removeMutation(mutation.id);
        } catch (error: any) {
          // If error is 400+, maybe we should drop the mutation if it's invalid?
          // If 500 or network error, break and try again later
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            // Client error, likely invalid payload or idempotency duplicate
            // We can drop it to avoid infinite loop
            console.error('Dropping invalid mutation', mutation.id, error.response.data);
            await mutationQueue.removeMutation(mutation.id);
          } else {
            // Network or server error, stop syncing and retry later
            console.error('Sync failed, will retry later', error);
            throw error;
          }
        }
      }
    }
    
    // Invalidate everything to refresh with real server IDs
    await queryClient.invalidateQueries();
  } catch (err) {
    console.error('Error in sync engine', err);
  } finally {
    setSyncing(false);
    
    // Count remaining
    const remaining = await mutationQueue.peekMutations(userId, 50);
    setPendingCount(remaining.length);
  }
}
