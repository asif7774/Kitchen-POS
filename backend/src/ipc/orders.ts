import { ipcMain } from 'electron';
import { getDB } from '../db';
import Store from 'electron-store';

const store = new Store();

interface MenuItemRow {
  id: number;
  name: string;
  price: number;
  cgst_rate: number;
  sgst_rate: number;
  hsn_code: string | null;
}

interface CartItemPayload {
  id: number;
  name: string;
  price: number;
  qty: number;
  note: string;
}

interface SendKOTPayload {
  tableId: number;
  items: CartItemPayload[];
  staffId?: number;
  covers?: number;
  note?: string;
  customerId?: number;
  type?: 'dine-in' | 'takeaway' | 'delivery';
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error occurred';
}

function getActiveBusinessDate(db: ReturnType<typeof getDB>): string | null {
  const row = db.prepare(
    "SELECT business_date FROM business_sessions WHERE status = 'open' LIMIT 1"
  ).get() as { business_date: string } | undefined;
  return row?.business_date ?? null;
}

export function registerOrdersIPC() {
  ipcMain.handle('orders:create', async (_, payload: { tableId: number; staffId?: number; covers?: number; note?: string; customerId?: number; type?: 'dine-in' | 'takeaway' | 'delivery' }) => {
    try {
      const db = getDB();
      const businessDate = getActiveBusinessDate(db);
      const info = db.prepare(
        'INSERT INTO orders (table_id, staff_id, covers, note, customer_id, type, status, business_date) VALUES (?, ?, ?, ?, ?, ?, "open", ?)'
      ).run(payload.tableId, payload.staffId ?? null, payload.covers ?? 1, payload.note ?? '', payload.customerId ?? null, payload.type ?? 'dine-in', businessDate);
      return { success: true, data: info.lastInsertRowid };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('orders:updateCustomer', async (_, payload: { orderId: number; customerId: number }) => {
    try {
      const db = getDB();
      db.prepare('UPDATE orders SET customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(payload.customerId, payload.orderId);
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('orders:getOpen', async () => {
    try {
      const db = getDB();
      const orders = db.prepare(`
        SELECT o.*, c.name as customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.status != 'billed' AND o.status != 'cancelled'
      `).all();
      return { success: true, data: orders };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('orders:getByTable', async (_, payload: { tableId: number }) => {
    try {
      const db = getDB();
      const order = db.prepare(`
        SELECT o.*, c.name as customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.table_id = ? AND o.status != 'billed' AND o.status != 'cancelled'
        LIMIT 1
      `).get(payload.tableId) as { id: number } | undefined;

      if (!order) { return { success: true, data: null }; }

      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { success: true, data: { ...order, items } };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('orders:sendKOT', async (_, payload: SendKOTPayload) => {
    try {
      const db = getDB();
      const isAutoDebitEnabled = store.get('inventory_auto_debit', true) as boolean;
      const businessDate = getActiveBusinessDate(db);

      const result = db.transaction(() => {
        const order = db.prepare(`
          SELECT * FROM orders
          WHERE table_id = ? AND status != 'billed' AND status != 'cancelled'
          LIMIT 1
        `).get(payload.tableId) as { id: number; status: string } | undefined;

        let orderId: number;
        if (!order) {
          const info = db.prepare(`
            INSERT INTO orders (table_id, staff_id, covers, note, customer_id, type, status, business_date)
            VALUES (?, ?, ?, ?, ?, ?, 'kot_sent', ?)
          `).run(payload.tableId, payload.staffId ?? null, payload.covers ?? 1, payload.note ?? '', payload.customerId ?? null, payload.type ?? 'dine-in', businessDate);
          orderId = Number(info.lastInsertRowid);
        } else {
          orderId = order.id;
          db.prepare(`UPDATE orders SET status = 'kot_sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(orderId);
        }

        // Find max kot_number for this order
        const maxKotRow = db.prepare('SELECT MAX(kot_number) as max_kot FROM order_items WHERE order_id = ?').get(orderId) as { max_kot: number | null };
        const nextKotNumber = (maxKotRow.max_kot ?? 0) + 1;

        const itemsToPrint: CartItemPayload[] = [];
        for (const item of payload.items) {
          const menuDetails = db.prepare(`SELECT id, name, price, cgst_rate, sgst_rate, hsn_code FROM menu_items WHERE id = ?`).get(item.id) as MenuItemRow | undefined;
          if (menuDetails) {
            db.prepare(`
              INSERT INTO order_items (order_id, menu_item_id, name, qty, unit_price, cgst_rate, sgst_rate, hsn_code, note, preparation_status, kot_number)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            `).run(orderId, menuDetails.id, menuDetails.name, item.qty, menuDetails.price, menuDetails.cgst_rate, menuDetails.sgst_rate, menuDetails.hsn_code, item.note, nextKotNumber);
            itemsToPrint.push({ ...item });
          }

          if (isAutoDebitEnabled && item.qty > 0) {
            const recipe = db.prepare('SELECT inventory_item_id, qty_used FROM menu_inventory_map WHERE menu_item_id = ?').all(item.id) as { inventory_item_id: number; qty_used: number }[];
            for (const r of recipe) {
              const invDelta = -(item.qty * r.qty_used);
              db.prepare('UPDATE inventory_items SET qty_in_stock = qty_in_stock + ? WHERE id = ?').run(invDelta, r.inventory_item_id);
              db.prepare('INSERT INTO inventory_log (item_id, type, qty_change, note) VALUES (?, ?, ?, ?)').run(r.inventory_item_id, 'sale', invDelta, `Order #${orderId} KOT #${nextKotNumber}`);
            }
          }
        }

        return { orderId, itemsToPrint };
      })();

      return { success: true, data: result };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('orders:cancelOrder', async (_, payload: { orderId: number; note?: string }) => {
    try {
      const db = getDB();
      const isAutoDebitEnabled = store.get('inventory_auto_debit', true) as boolean;

      const result = db.transaction(() => {
        const order = db.prepare(`
          SELECT * FROM orders
          WHERE id = ? AND status != 'billed' AND status != 'cancelled'
        `).get(payload.orderId) as { id: number; status: string } | undefined;

        if (!order) { throw new Error('Order not found or already closed.'); }

        if (isAutoDebitEnabled) {
          const items = db.prepare('SELECT menu_item_id, qty FROM order_items WHERE order_id = ?').all(order.id) as { menu_item_id: number; qty: number }[];
          for (const item of items) {
            const recipe = db.prepare('SELECT inventory_item_id, qty_used FROM menu_inventory_map WHERE menu_item_id = ?').all(item.menu_item_id) as { inventory_item_id: number; qty_used: number }[];
            for (const r of recipe) {
              const invDelta = item.qty * r.qty_used;
              db.prepare('UPDATE inventory_items SET qty_in_stock = qty_in_stock + ? WHERE id = ?').run(invDelta, r.inventory_item_id);
              db.prepare('INSERT INTO inventory_log (item_id, type, qty_change, note) VALUES (?, ?, ?, ?)').run(r.inventory_item_id, 'adjustment', invDelta, `Order #${order.id} Cancelled`);
            }
          }
        }

        db.prepare(`UPDATE orders SET status = 'cancelled', note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(payload.note ?? '', order.id);
        const orderRecord = db.prepare('SELECT table_id FROM orders WHERE id = ?').get(order.id) as { table_id: number };
        if (orderRecord && orderRecord.table_id) {
          db.prepare('UPDATE tables SET custom_name = NULL WHERE id = ?').run(orderRecord.table_id);
        }
        return order.id;
      })();

      return { success: true, data: result };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('orders:cancelOrderItem', async (_, payload: { orderId: number; orderItemId: number; note: string }) => {
    try {
      const db = getDB();
      const isAutoDebitEnabled = store.get('inventory_auto_debit', true) as boolean;
      
      db.transaction(() => {
        const item = db.prepare('SELECT menu_item_id, qty FROM order_items WHERE id = ? AND order_id = ?').get(payload.orderItemId, payload.orderId) as { menu_item_id: number; qty: number } | undefined;
        if (!item) { throw new Error('Item not found in order'); }

        if (isAutoDebitEnabled) {
          const recipe = db.prepare('SELECT inventory_item_id, qty_used FROM menu_inventory_map WHERE menu_item_id = ?').all(item.menu_item_id) as { inventory_item_id: number; qty_used: number }[];
          for (const r of recipe) {
            const invDelta = item.qty * r.qty_used;
            db.prepare('UPDATE inventory_items SET qty_in_stock = qty_in_stock + ? WHERE id = ?').run(invDelta, r.inventory_item_id);
            db.prepare('INSERT INTO inventory_log (item_id, type, qty_change, note) VALUES (?, ?, ?, ?)').run(r.inventory_item_id, 'adjustment', invDelta, `Order #${payload.orderId} Item Voided: ${payload.note}`);
          }
        }

        db.prepare('DELETE FROM order_items WHERE id = ?').run(payload.orderItemId);
      })();

      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('orders:addItem', async () => ({ success: true }));
  ipcMain.handle('orders:updateItem', async () => ({ success: true }));
  ipcMain.handle('orders:removeItem', async () => ({ success: true }));
}
