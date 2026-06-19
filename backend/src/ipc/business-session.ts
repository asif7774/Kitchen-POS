import { ipcMain } from 'electron';
import { getDB } from '../db';

interface BusinessSessionRow {
  id: number;
  business_date: string;
  started_at: string;
  closed_at: string | null;
  status: 'open' | 'closed';
  started_by: number | null;
  closed_by: number | null;
  notes: string | null;
}

export function formatBusinessDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}

export function registerBusinessSessionIPC() {
  ipcMain.handle('businessSession:getActive', async () => {
    try {
      const db = getDB();
      const session = db.prepare(
        "SELECT * FROM business_sessions WHERE status = 'open' LIMIT 1"
      ).get() as BusinessSessionRow | undefined;
      return { success: true, data: session ?? null };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('businessSession:start', async (_, payload: { staffId: number; notes?: string }) => {
    try {
      const db = getDB();
      const businessDate = formatBusinessDate(new Date());
      const result = db.prepare(
        'INSERT INTO business_sessions (business_date, started_by, notes) VALUES (?, ?, ?)'
      ).run(businessDate, payload.staffId, payload.notes ?? null);
      const session = db.prepare('SELECT * FROM business_sessions WHERE id = ?').get(result.lastInsertRowid) as BusinessSessionRow;
      return { success: true, data: session };
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('UNIQUE constraint')) {
        return { success: false, error: 'A business day is already open.' };
      }
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('businessSession:close', async (_, payload: { sessionId: number; staffId: number; notes?: string }) => {
    try {
      const db = getDB();
      db.prepare(
        "UPDATE business_sessions SET closed_at = CURRENT_TIMESTAMP, status = 'closed', closed_by = ?, notes = ? WHERE id = ? AND status = 'open'"
      ).run(payload.staffId, payload.notes ?? null, payload.sessionId);
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: errMsg(e) };
    }
  });
}
