import { ipcMain } from 'electron';
import { getDB } from '../db';

interface InventoryItemRow {
  id: number;
  name: string;
  unit: string;
  qty_in_stock: number;
  low_stock_alert_at: number;
  cost_per_unit: number;
}

interface UpsertInventoryItemPayload {
  id?: number;
  name: string;
  unit: string;
  low_stock_alert_at?: number;
  cost_per_unit?: number;
}

interface AdjustInventoryPayload {
  item_id: number;
  type: 'purchase' | 'sale' | 'adjustment' | 'wastage';
  qty_change: number;
  note?: string;
}

export function registerInventoryIPC() {
  ipcMain.handle('inventory:getAll', async () => {
    try {
      const db = getDB();
      const items = db.prepare('SELECT * FROM inventory_items ORDER BY name ASC').all() as InventoryItemRow[];
      return { success: true, data: items };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error' };
    }
  });

  ipcMain.handle('inventory:upsertItem', async (_, payload: UpsertInventoryItemPayload) => {
    try {
      const db = getDB();
      if (payload.id) {
        db.prepare(`
          UPDATE inventory_items 
          SET name = ?, unit = ?, low_stock_alert_at = ?, cost_per_unit = ?
          WHERE id = ?
        `).run(payload.name, payload.unit, payload.low_stock_alert_at ?? 0, payload.cost_per_unit ?? 0, payload.id);
        return { success: true, data: { id: payload.id } };
      } else {
        const result = db.prepare(`
          INSERT INTO inventory_items (name, unit, low_stock_alert_at, cost_per_unit, qty_in_stock)
          VALUES (?, ?, ?, ?, 0)
        `).run(payload.name, payload.unit, payload.low_stock_alert_at ?? 0, payload.cost_per_unit ?? 0);
        return { success: true, data: { id: result.lastInsertRowid } };
      }
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error' };
    }
  });

  ipcMain.handle('inventory:adjust', async (_, payload: AdjustInventoryPayload) => {
    try {
      const db = getDB();
      const transaction = db.transaction((item_id: number, type: string, qty_change: number, note: string | null) => {
        db.prepare(`
          INSERT INTO inventory_log (item_id, type, qty_change, note)
          VALUES (?, ?, ?, ?)
        `).run(item_id, type, qty_change, note);

        db.prepare(`
          UPDATE inventory_items 
          SET qty_in_stock = qty_in_stock + ? 
          WHERE id = ?
        `).run(qty_change, item_id);
      });

      transaction(payload.item_id, payload.type, payload.qty_change, payload.note ?? null);
      
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error' };
    }
  });
}
