import * as SQLite from 'expo-sqlite';
import { MutationQueue, QueuedMutation } from './mutationQueue';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('stealthtrack_mutations.db');
  }
  return dbInstance;
}

export const nativeQueue: MutationQueue = {
  initQueue: async () => {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_mutations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        payload TEXT,
        idempotencyKey TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
  },

  pushMutation: async (mutation) => {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO offline_mutations (userId, method, url, payload, idempotencyKey, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [
        mutation.userId,
        mutation.method,
        mutation.url,
        mutation.payload,
        mutation.idempotencyKey,
        new Date().toISOString()
      ]
    );
  },

  peekMutations: async (userId, limit = 50) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM offline_mutations WHERE userId = ? ORDER BY id ASC LIMIT ?',
      [userId, limit]
    );
    return rows as QueuedMutation[];
  },

  removeMutation: async (id) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM offline_mutations WHERE id = ?', [id]);
  },

  clearUserMutations: async (userId) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM offline_mutations WHERE userId = ?', [userId]);
  }
};
