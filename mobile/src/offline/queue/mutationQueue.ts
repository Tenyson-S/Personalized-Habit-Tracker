import { Platform } from 'react-native';

export interface QueuedMutation {
  id: string; // sqlite integer id or uuid
  userId: string;
  method: string;
  url: string;
  payload: string; // JSON string
  idempotencyKey: string;
  createdAt: string;
}

export interface MutationQueue {
  initQueue: () => Promise<void>;
  pushMutation: (mutation: Omit<QueuedMutation, 'id' | 'createdAt'>) => Promise<void>;
  peekMutations: (userId: string, limit?: number) => Promise<QueuedMutation[]>;
  removeMutation: (id: string) => Promise<void>;
  clearUserMutations: (userId: string) => Promise<void>;
}

export const mutationQueue: MutationQueue = Platform.OS === 'web'
  ? require('./mutationQueue.web').webQueue
  : require('./mutationQueue.native').nativeQueue;
