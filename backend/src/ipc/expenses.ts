import { ipcMain } from 'electron';
import { getDB } from '../db';

export function registerExpensesIPC() {
  ipcMain.handle('expenses:getAll', async (event, payload: { start?: string, end?: string } = {}) => {
    try {
      const db = getDB();
      let query = `
        SELECT e.*, s.name as staff_name 
        FROM expenses e
        LEFT JOIN staff s ON e.staff_id = s.id
      `;
      const params: any[] = [];
      
      if (payload.start && payload.end) {
        query += ` WHERE e.date >= ? AND e.date <= ?`;
        params.push(payload.start, payload.end);
      } else if (payload.start) {
        query += ` WHERE e.date >= ?`;
        params.push(payload.start);
      } else if (payload.end) {
        query += ` WHERE e.date <= ?`;
        params.push(payload.end);
      }
      
      query += ` ORDER BY e.date DESC, e.id DESC`;
      
      const expenses = db.prepare(query).all(...params);
      return { success: true, data: expenses };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('expenses:create', async (event, payload: { date: string, category: string, amount: number, description?: string, staff_id?: number }) => {
    try {
      const db = getDB();
      const stmt = db.prepare(`
        INSERT INTO expenses (date, category, amount, description, staff_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        payload.date,
        payload.category,
        payload.amount,
        payload.description || null,
        payload.staff_id || null
      );
      
      return { success: true, data: { id: info.lastInsertRowid } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('expenses:delete', async (event, payload: { id: number }) => {
    try {
      const db = getDB();
      const stmt = db.prepare(`DELETE FROM expenses WHERE id = ?`);
      const info = stmt.run(payload.id);
      
      if (info.changes > 0) {
        return { success: true };
      }
      return { success: false, error: 'Expense not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
