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

  ipcMain.handle('tables:upsert', async (_, table: any) => {
    try {
      const db = getDB();
      if (table.id) {
        db.prepare('UPDATE tables SET name = ?, capacity = ? WHERE id = ?')
          .run(table.name, table.capacity, table.id);
        return { success: true };
      } 
        const result = db.prepare('INSERT INTO tables (name, capacity) VALUES (?, ?)')
          .run(table.name, table.capacity);
        return { success: true, data: { id: result.lastInsertRowid, ...table } };
      
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('tables:delete', async (_, id: number) => {
    try {
      const db = getDB();
      db.prepare('DELETE FROM tables WHERE id = ?').run(id);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('tables:updateCustomName', async (_, payload: { id: number; customName: string | null }) => {
    try {
      const db = getDB();
      db.prepare('UPDATE tables SET custom_name = ? WHERE id = ?').run(payload.customName, payload.id);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}
