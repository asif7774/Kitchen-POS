import { ipcMain } from 'electron';
import { getDB } from '../db';

export function registerTablesIPC() {
  ipcMain.handle('tables:getAll', async () => {
    try {
      const db = getDB();
      const tables = db.prepare('SELECT * FROM tables').all();
      return { success: true, data: tables };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // Stubs
  ipcMain.handle('tables:upsert', async () => ({ success: true }));
  ipcMain.handle('tables:delete', async () => ({ success: true }));
}
