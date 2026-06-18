import { ipcMain } from 'electron';
import { getDB } from '../db';

interface KDSTicketItem {
  id: number;
  menu_item_id: number;
  name: string;
  qty: number;
  note: string | null;
  preparation_status: 'pending' | 'preparing' | 'ready' | 'served';
  prepared_at: string | null;
  served_at: string | null;
}

interface KDSTicket {
  order_id: number;
  table_id: number;
  table_name: string;
  order_note: string | null;
  type: 'dine-in' | 'takeaway' | 'delivery';
  created_at: string;
  updated_at: string;
  items: KDSTicketItem[];
}

export function registerKDSIPC() {
  ipcMain.handle('kds:getActiveTickets', async () => {
    try {
      const db = getDB();
      // Fetch active orders that are not billed or cancelled
      const activeOrders = db.prepare(`
        SELECT 
          o.id AS order_id,
          o.table_id,
          t.name AS table_name,
          o.note AS order_note,
          o.type,
          o.created_at,
          o.updated_at
        FROM orders o
        JOIN tables t ON o.table_id = t.id
        WHERE o.status IN ('open', 'kot_sent')
        ORDER BY o.created_at ASC
      `).all() as Array<{
        order_id: number;
        table_id: number;
        table_name: string;
        order_note: string | null;
        type: 'dine-in' | 'takeaway' | 'delivery';
        created_at: string;
        updated_at: string;
      }>;

      const tickets: KDSTicket[] = [];

      for (const order of activeOrders) {
        // Fetch active order items that are not served
        const items = db.prepare(`
          SELECT 
            id,
            menu_item_id,
            name,
            qty,
            note,
            preparation_status,
            prepared_at,
            served_at
          FROM order_items
          WHERE order_id = ? AND preparation_status != 'served'
        `).all(order.order_id) as KDSTicketItem[];

        if (items.length > 0) {
          tickets.push({
            ...order,
            items,
          });
        }
      }

      return { success: true, data: tickets };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('kds:updateItemStatus', async (_, payload: { itemId: number; status: 'pending' | 'preparing' | 'ready' | 'served' }) => {
    try {
      const db = getDB();
      const status = payload.status;
      const itemId = payload.itemId;

      if (status === 'ready') {
        db.prepare(`
          UPDATE order_items 
          SET preparation_status = ?, prepared_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(status, itemId);
      } else if (status === 'served') {
        db.prepare(`
          UPDATE order_items 
          SET preparation_status = ?, served_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(status, itemId);
      } else {
        db.prepare(`
          UPDATE order_items 
          SET preparation_status = ?, prepared_at = NULL, served_at = NULL 
          WHERE id = ?
        `).run(status, itemId);
      }

      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('kds:updateOrderStatus', async (_, payload: { orderId: number; status: 'pending' | 'preparing' | 'ready' | 'served' }) => {
    try {
      const db = getDB();
      const status = payload.status;
      const orderId = payload.orderId;

      if (status === 'ready') {
        db.prepare(`
          UPDATE order_items 
          SET preparation_status = ?, prepared_at = CURRENT_TIMESTAMP 
          WHERE order_id = ? AND preparation_status != 'served'
        `).run(status, orderId);
      } else if (status === 'served') {
        db.prepare(`
          UPDATE order_items 
          SET preparation_status = ?, served_at = CURRENT_TIMESTAMP 
          WHERE order_id = ? AND preparation_status != 'served'
        `).run(status, orderId);
      } else {
        db.prepare(`
          UPDATE order_items 
          SET preparation_status = ?, prepared_at = NULL, served_at = NULL 
          WHERE order_id = ? AND preparation_status != 'served'
        `).run(status, orderId);
      }

      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });
}
