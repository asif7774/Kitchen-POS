import { ipcMain } from 'electron';
import { getDB } from '../db';

interface CustomerRow {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  loyalty_points: number;
  total_visits: number;
  credit_limit: number;
  outstanding_balance: number;
  created_at: string;
}

interface BillRow {
  bill_id: number;
  bill_number: string;
  total_amount: number;
  order_id: number;
  created_at: string;
}

interface OrderItemRow {
  name: string;
  qty: number;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error occurred';
}

export function registerCustomersIPC() {
  ipcMain.handle('customers:getAll', async () => {
    try {
      const db = getDB();
      const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
      return { success: true, data: customers };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('customers:getById', async (_, id: number) => {
    try {
      const db = getDB();
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as CustomerRow | undefined;
      if (!customer) { return { success: false, error: 'Customer not found' }; }
      return { success: true, data: customer };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('customers:create', async (_, payload: { name: string; phone?: string; email?: string; credit_limit?: number }) => {
    try {
      const db = getDB();
      const info = db.prepare(`
        INSERT INTO customers (name, phone, email, credit_limit)
        VALUES (?, ?, ?, ?)
      `).run(payload.name, payload.phone ?? null, payload.email ?? null, payload.credit_limit ?? 0);
      return { success: true, data: { id: info.lastInsertRowid } };
    } catch (e: unknown) {
      const msg = errMsg(e);
      if (msg.includes('UNIQUE constraint failed')) {
        return { success: false, error: 'Phone number already exists.' };
      }
      return { success: false, error: msg };
    }
  });

  ipcMain.handle('customers:update', async (_, payload: { id: number; name: string; phone?: string; email?: string; credit_limit?: number }) => {
    try {
      const db = getDB();
      db.prepare(`
        UPDATE customers SET name = ?, phone = ?, email = ?, credit_limit = ? WHERE id = ?
      `).run(payload.name, payload.phone ?? null, payload.email ?? null, payload.credit_limit ?? 0, payload.id);
      return { success: true };
    } catch (e: unknown) {
      const msg = errMsg(e);
      if (msg.includes('UNIQUE constraint failed')) {
        return { success: false, error: 'Phone number already exists.' };
      }
      return { success: false, error: msg };
    }
  });

  ipcMain.handle('customers:delete', async (_, id: number) => {
    try {
      const db = getDB();
      db.prepare('DELETE FROM customers WHERE id = ?').run(id);
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('customers:search', async (_, query: string) => {
    try {
      const db = getDB();
      const search = `%${query}%`;
      const customers = db.prepare(`
        SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC LIMIT 10
      `).all(search, search);
      return { success: true, data: customers };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('customers:settleBalance', async (_, payload: { customerId: number; amount: number; method: string }) => {
    try {
      const db = getDB();

      const customer = db.prepare('SELECT outstanding_balance FROM customers WHERE id = ?').get(payload.customerId) as { outstanding_balance: number } | undefined;
      if (!customer) {
        return { success: false, error: 'Customer not found.' };
      }
      if (payload.amount <= 0) {
        return { success: false, error: 'Settlement amount must be greater than zero.' };
      }
      if (payload.amount > customer.outstanding_balance) {
        return { success: false, error: `Amount exceeds outstanding balance of ₹${customer.outstanding_balance.toFixed(2)}.` };
      }

      db.transaction(() => {
        db.prepare(`INSERT INTO payments (order_id, method, amount, reference) VALUES (NULL, ?, ?, ?)`).run(payload.method, payload.amount, 'Balance Settlement');
        db.prepare(`UPDATE customers SET outstanding_balance = outstanding_balance - ? WHERE id = ?`).run(payload.amount, payload.customerId);
      })();

      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
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
      `).all(customerId) as BillRow[];

      const history = bills.map(b => {
        const items = db.prepare('SELECT name, qty FROM order_items WHERE order_id = ?').all(b.order_id) as OrderItemRow[];
        return {
          orderId: b.order_id,
          date: b.created_at,
          billNumber: b.bill_number,
          totalAmount: b.total_amount,
          items,
        };
      });

      return { success: true, data: history };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });
}
