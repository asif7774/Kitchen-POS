import { ipcMain } from 'electron';
import { getDB } from '../db';

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
}

export function registerOrdersIPC() {
  ipcMain.handle('orders:create', async (_, payload: { tableId: number; staffId?: number; covers?: number; note?: string }) => {
    try {
      const db = getDB();
      const stmt = db.prepare('INSERT INTO orders (table_id, staff_id, covers, note, status) VALUES (?, ?, ?, ?, "open")');
      const info = stmt.run(payload.tableId, payload.staffId ?? 1, payload.covers ?? 1, payload.note ?? '');
      return { success: true, data: info.lastInsertRowid };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('orders:getOpen', async () => {
    try {
      const db = getDB();
      const orders = db.prepare('SELECT * FROM orders WHERE status != "billed" AND status != "cancelled"').all();
      return { success: true, data: orders };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('orders:getByTable', async (_, payload: { tableId: number }) => {
    try {
      const db = getDB();
      // Get the active open or kot_sent order for the table
      const order = db.prepare(`
        SELECT * FROM orders 
        WHERE table_id = ? AND status != 'billed' AND status != 'cancelled'
        LIMIT 1
      `).get(payload.tableId) as { id: number } | undefined;

      if (!order) {
        return { success: true, data: null };
      }

      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all();
      return { success: true, data: { ...order, items } };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('orders:sendKOT', async (_, payload: SendKOTPayload) => {
    try {
      const db = getDB();
      
      const result = db.transaction(() => {
        // 1. Find or create active order for this table
        let order = db.prepare(`
          SELECT * FROM orders 
          WHERE table_id = ? AND status != 'billed' AND status != 'cancelled'
          LIMIT 1
        `).get(payload.tableId) as { id: number; status: string } | undefined;

        let orderId: number;
        if (!order) {
          const insertStmt = db.prepare(`
            INSERT INTO orders (table_id, staff_id, covers, note, status)
            VALUES (?, ?, ?, ?, 'kot_sent')
          `);
          const info = insertStmt.run(payload.tableId, payload.staffId ?? 1, payload.covers ?? 1, payload.note ?? '');
          orderId = Number(info.lastInsertRowid);
        } else {
          orderId = order.id;
          // Update order status to kot_sent
          db.prepare(`
            UPDATE orders SET status = 'kot_sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `).run(orderId);
        }

        // 2. Fetch current items in the DB for this order
        const existingItems = db.prepare(`
          SELECT * FROM order_items WHERE order_id = ?
        `).all() as Array<{ id: number; menu_item_id: number; qty: number; preparation_status: string }>;

        const existingItemMap = new Map(existingItems.map(item => [item.menu_item_id, item]));

        // 3. Process each item in the KOT cart
        for (const item of payload.items) {
          const existing = existingItemMap.get(item.id);
          let qtyDelta = item.qty;
          
          if (existing) {
            qtyDelta = item.qty - existing.qty;
            // Update quantity. If new qty is greater, set status of the new additions to 'pending'
            const newStatus = existing.preparation_status === 'served' || existing.preparation_status === 'ready' 
              ? 'pending' // reset if they are ordering more of a finished item
              : existing.preparation_status;

            db.prepare(`
              UPDATE order_items 
              SET qty = ?, note = ?, preparation_status = ?
              WHERE id = ?
            `).run(item.qty, item.note, newStatus, existing.id);
            
            existingItemMap.delete(item.id); // mark as processed
          } else {
            // Snapshot from menu_items
            const menuDetails = db.prepare(`
              SELECT id, name, price, cgst_rate, sgst_rate, hsn_code 
              FROM menu_items 
              WHERE id = ?
            `).get(item.id) as MenuItemRow | undefined;

            if (menuDetails) {
              db.prepare(`
                INSERT INTO order_items (
                  order_id, menu_item_id, name, qty, unit_price, 
                  cgst_rate, sgst_rate, hsn_code, note, preparation_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
              `).run(
                orderId,
                menuDetails.id,
                menuDetails.name,
                item.qty,
                menuDetails.price,
                menuDetails.cgst_rate ?? 0,
                menuDetails.sgst_rate ?? 0,
                menuDetails.hsn_code,
                item.note
              );
            }
          }

          // Auto-deduct inventory
          if (qtyDelta !== 0) {
            const recipe = db.prepare('SELECT inventory_item_id, qty_used FROM menu_inventory_map WHERE menu_item_id = ?').all(item.id) as { inventory_item_id: number; qty_used: number }[];
            for (const r of recipe) {
              const invDelta = -(qtyDelta * r.qty_used); // Add if negative qtyDelta (reducing KOT), deduct if positive (adding to KOT)
              db.prepare('UPDATE inventory_items SET qty_in_stock = qty_in_stock + ? WHERE id = ?').run(invDelta, r.inventory_item_id);
              db.prepare('INSERT INTO inventory_log (item_id, type, qty_change, note) VALUES (?, ?, ?, ?)').run(
                r.inventory_item_id,
                qtyDelta > 0 ? 'sale' : 'adjustment',
                invDelta,
                `Order #${orderId} KOT Update`
              );
            }
          }
        }

        // 4. Remove any items that are no longer in the cart
        for (const [_, item] of existingItemMap) {
          // Restore inventory
          const recipe = db.prepare('SELECT inventory_item_id, qty_used FROM menu_inventory_map WHERE menu_item_id = ?').all(item.menu_item_id) as { inventory_item_id: number; qty_used: number }[];
          for (const r of recipe) {
            const invDelta = item.qty * r.qty_used; // adding back full qty
            db.prepare('UPDATE inventory_items SET qty_in_stock = qty_in_stock + ? WHERE id = ?').run(invDelta, r.inventory_item_id);
            db.prepare('INSERT INTO inventory_log (item_id, type, qty_change, note) VALUES (?, ?, ?, ?)').run(
              r.inventory_item_id,
              'adjustment',
              invDelta,
              `Order #${orderId} Item Removed`
            );
          }
          db.prepare('DELETE FROM order_items WHERE id = ?').run(item.id);
        }

        return orderId;
      })();

      return { success: true, data: result };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  // Stubs for remaining unused ones to satisfy TypeScript
  ipcMain.handle('orders:addItem', async () => ({ success: true }));
  ipcMain.handle('orders:updateItem', async () => ({ success: true }));
  ipcMain.handle('orders:removeItem', async () => ({ success: true }));
}
