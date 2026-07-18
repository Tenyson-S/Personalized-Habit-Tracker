import { MutationQueue, QueuedMutation } from './mutationQueue';

const DB_NAME = 'stealthtrack_mutations';
const STORE_NAME = 'offline_mutations';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }
  return dbPromise;
}

export const webQueue: MutationQueue = {
  initQueue: async () => {
    if (typeof window !== 'undefined') {
      await getDb();
    }
  },

  pushMutation: async (mutation) => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add({
        ...mutation,
        createdAt: new Date().toISOString()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  peekMutations: async (userId, limit = 50) => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('userId');
      const request = index.getAll(IDBKeyRange.only(userId));
      
      request.onsuccess = () => {
        // Sort by id asc just to be sure, then limit
        const results = (request.result as QueuedMutation[])
          .sort((a, b) => Number(a.id) - Number(b.id))
          .slice(0, limit);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  },

  removeMutation: async (id) => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(Number(id)); // IDB autoIncrement keys are numbers
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  clearUserMutations: async (userId) => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('userId');
      const request = index.openCursor(IDBKeyRange.only(userId));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
};
