import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('stealthtrack.db');
  }
  return dbInstance;
}

export const nativeDb = {
  executeSql: async (query: string, params: any[] = []): Promise<any[]> => {
    const db = await getDb();
    const result = await db.runAsync(query, params);
    // Note: expo-sqlite v15 runAsync returns { lastInsertRowId, changes }
    // for selects we use getAllAsync
    if (query.trim().toUpperCase().startsWith('SELECT')) {
        return await db.getAllAsync(query, params);
    }
    return [result]; // wrap in array for consistency
  },
  transaction: async (callback: (tx: any) => Promise<void>) => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      // In expo-sqlite v15, transactions just wrap the normal async calls
      await callback({
        executeSql: async (q: string, p: any[] = []) => {
          if (q.trim().toUpperCase().startsWith('SELECT')) {
            return await db.getAllAsync(q, p);
          }
          return [await db.runAsync(q, p)];
        }
      });
    });
  }
};
