import { ipcMain } from 'electron';
import { getDB } from '../db';

interface OpenShiftPayload {
  staffId: number;
  openingCash: number;
}

interface CloseShiftPayload {
  shiftId: number;
  closingCash: number;
  note?: string;
}

interface GetTotalsPayload {
  openedAt: string;
}

interface ShiftRow {
  id: number;
  staff_id: number;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  closing_cash: number | null;
  note: string | null;
}

interface PaymentTotalRow {
  method: 'cash' | 'card' | 'upi' | 'complimentary';
  total_amount: number;
}

export function registerShiftsIPC() {
  ipcMain.handle('shifts:getActive', async () => {
    try {
      const db = getDB();
      const activeShift = db.prepare(`
        SELECT * FROM shifts 
        WHERE closed_at IS NULL 
        ORDER BY opened_at DESC 
        LIMIT 1
      `).get() as ShiftRow | undefined;

      return { success: true, data: activeShift ?? null };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown shift error' };
    }
  });

  ipcMain.handle('shifts:open', async (_, payload: OpenShiftPayload) => {
    try {
      const db = getDB();
      const result = db.prepare(`
        INSERT INTO shifts (staff_id, opened_at, opening_cash)
        VALUES (?, CURRENT_TIMESTAMP, ?)
      `).run(payload.staffId, payload.openingCash);

      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown shift error' };
    }
  });

  ipcMain.handle('shifts:close', async (_, payload: CloseShiftPayload) => {
    try {
      const db = getDB();
      db.prepare(`
        UPDATE shifts 
        SET closed_at = CURRENT_TIMESTAMP, closing_cash = ?, note = ?
        WHERE id = ?
      `).run(payload.closingCash, payload.note ?? null, payload.shiftId);

      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown shift error' };
    }
  });

  ipcMain.handle('shifts:getTotals', async (_, payload: GetTotalsPayload) => {
    try {
      const db = getDB();
      const paymentTotals = db.prepare(`
        SELECT 
          method, 
          COALESCE(SUM(amount), 0) AS total_amount
        FROM payments
        WHERE paid_at >= ?
        GROUP BY method
      `).all(payload.openedAt) as PaymentTotalRow[];

      // Map rows to clean payment breakdown object
      const totals = {
        cash: 0,
        card: 0,
        upi: 0,
        complimentary: 0
      };

      paymentTotals.forEach(row => {
        if (row.method in totals) {
          totals[row.method] = row.total_amount;
        }
      });

      return { success: true, data: totals };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown shift error' };
    }
  });
}
