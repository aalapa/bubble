declare module 'react-native-sqlite-storage' {
  export interface SQLiteDatabase {
    executeSql(
      sql: string,
      params?: any[],
    ): Promise<[{rows: {length: number; item: (index: number) => any}; insertId?: number}]>;
    close(): Promise<void>;
  }

  export interface DatabaseParams {
    name: string;
    location: string;
  }

  interface SQLiteStatic {
    DEBUG: (debug: boolean) => void;
    enablePromise: (enable: boolean) => void;
    openDatabase: (params: DatabaseParams) => Promise<SQLiteDatabase>;
    SQLiteDatabase: SQLiteDatabase;
  }

  const SQLite: SQLiteStatic;
  export default SQLite;
}
