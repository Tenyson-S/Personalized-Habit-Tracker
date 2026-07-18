import { Platform } from 'react-native';

export interface DatabaseAdapter {
  executeSql: (query: string, params?: any[]) => Promise<any[]>;
  transaction: (callback: (tx: any) => Promise<void>) => Promise<void>;
}

// Dynamically load the correct adapter
export const db: DatabaseAdapter = Platform.OS === 'web'
  ? require('./database.web').webDb
  : require('./database.native').nativeDb;
