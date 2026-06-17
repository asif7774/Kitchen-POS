import { ipcMain } from 'electron';
import { getDB } from '../db';

export function registerOrdersIPC() {
  ipcMain.handle('orders:create', async (event, payload) => {
    try {
      const db = getDB();
      const stmt = db.prepare('INSERT INTO orders (table_id, staff_id, covers, note) VALUES (?, ?, ?, ?)');
      const info = stmt.run(payload.tableId, payload.staffId, payload.covers || 1, payload.note || '');
      return { success: true, data: info.lastInsertRowid };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('orders:getOpen', async () => {
    try {
      const db = getDB();
      const orders = db.prepare('SELECT * FROM orders WHERE status != "billed" AND status != "cancelled"').all();
      return { success: true, data: orders };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
  
  // Stubs for others
  ipcMain.handle('orders:addItem', async () => ({ success: true }));
  ipcMain.handle('orders:updateItem', async () => ({ success: true }));
  ipcMain.handle('orders:removeItem', async () => ({ success: true }));
  ipcMain.handle('orders:getByTable', async () => ({ success: true }));
}
