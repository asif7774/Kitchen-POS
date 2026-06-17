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

  // Stubs
  ipcMain.handle('staff:upsert', async () => ({ success: true }));
}
