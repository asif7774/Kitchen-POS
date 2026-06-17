import { ipcMain } from 'electron';
import { getDB } from '../db';

export function registerStaffIPC() {
  ipcMain.handle('staff:login', async (event, payload) => {
    try {
      const db = getDB();
      const user = db.prepare('SELECT * FROM staff WHERE pin = ? AND is_active = 1').get(payload.pin);
      if (user) {
        return { success: true, data: user };
      } else {
        return { success: false, error: 'Invalid PIN' };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('staff:getAll', async () => {
    try {
      const db = getDB();
      const staff = db.prepare('SELECT * FROM staff').all();
      return { success: true, data: staff };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('staff:upsert', async (event, payload: { id?: number, name: string, pin: string, role: string }) => {
    try {
      const db = getDB();
      if (payload.id) {
        const stmt = db.prepare('UPDATE staff SET name = ?, pin = ?, role = ? WHERE id = ?');
        stmt.run(payload.name, payload.pin, payload.role, payload.id);
        return { success: true, data: { id: payload.id } };
      } else {
        const stmt = db.prepare('INSERT INTO staff (name, pin, role) VALUES (?, ?, ?)');
        const info = stmt.run(payload.name, payload.pin, payload.role);
        return { success: true, data: { id: info.lastInsertRowid } };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('staff:delete', async (event, payload: { id: number }) => {
    try {
      const db = getDB();
      const stmt = db.prepare('UPDATE staff SET is_active = 0 WHERE id = ?');
      const info = stmt.run(payload.id);
      if (info.changes > 0) {
        return { success: true };
      }
      return { success: false, error: 'Staff not found' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}
