import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';

let dbInstance: Database.Database | null = null;

export function getDB(): Database.Database {
  if (!dbInstance) {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'pos.db');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
  }
  return dbInstance;
}
