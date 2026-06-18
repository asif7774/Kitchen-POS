import { ipcMain } from 'electron';
import { getDB } from '../db';

export function registerCustomersIPC() {
  ipcMain.handle('customers:getAll', async () => {
    try {
      const db = getDB();
      const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
      return { success: true, data: customers };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('customers:create', async (_, payload: { name: string; phone?: string; email?: string; credit_limit?: number }) => {
    try {
      const db = getDB();
      const stmt = db.prepare(`
        INSERT INTO customers (name, phone, email, credit_limit)
        VALUES (?, ?, ?, ?)
      `);
      const info = stmt.run(
        payload.name,
        payload.phone ?? null,
        payload.email ?? null,
        payload.credit_limit ?? 0
      );
      return { success: true, data: { id: info.lastInsertRowid } };
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed')) {
        return { success: false, error: 'Phone number already exists.' };
      }
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('customers:update', async (_, payload: { id: number; name: string; phone?: string; email?: string; credit_limit?: number }) => {
    try {
      const db = getDB();
      const stmt = db.prepare(`
        UPDATE customers 
        SET name = ?, phone = ?, email = ?, credit_limit = ?
        WHERE id = ?
      `);
      stmt.run(
        payload.name,
        payload.phone ?? null,
        payload.email ?? null,
        payload.credit_limit ?? 0,
        payload.id
      );
      return { success: true };
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed')) {
        return { success: false, error: 'Phone number already exists.' };
      }
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('customers:delete', async (_, id: number) => {
    try {
      const db = getDB();
      db.prepare('DELETE FROM customers WHERE id = ?').run(id);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('customers:search', async (_, query: string) => {
    try {
      const db = getDB();
      const search = `%${query}%`;
      const customers = db.prepare(`
        SELECT * FROM customers 
        WHERE name LIKE ? OR phone LIKE ? 
        ORDER BY name ASC LIMIT 10
      `).all(search, search);
      return { success: true, data: customers };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('customers:settleBalance', async (_, payload: { customerId: number; amount: number; method: string }) => {
    try {
      const db = getDB();
      db.transaction(() => {
        // 1. Log payment (order_id is null for general settlement)
        db.prepare(`
          INSERT INTO payments (order_id, method, amount, reference)
          VALUES (NULL, ?, ?, ?)
        `).run(payload.method, payload.amount, 'Balance Settlement');

        // 2. Reduce outstanding balance
        db.prepare(`
          UPDATE customers SET outstanding_balance = outstanding_balance - ? WHERE id = ?
        `).run(payload.amount, payload.customerId);
      })();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('customers:getHistory', async (_, customerId: number) => {
    try {
      const db = getDB();
      const bills = db.prepare(`
        SELECT b.id as bill_id, b.bill_number, b.total_amount, o.id as order_id, o.created_at
        FROM bills b
        JOIN orders o ON b.order_id = o.id
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC
      `).all(customerId) as any[];

      const history = bills.map(b => {
        const items = db.prepare('SELECT name, qty FROM order_items WHERE order_id = ?').all(b.order_id);
        return {
          orderId: b.order_id,
          date: b.created_at,
          billNumber: b.bill_number,
          totalAmount: b.total_amount,
          items
        };
      });

      return { success: true, data: history };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}
