import { ipcMain } from 'electron';
import { getDB } from '../db';
import { hashPin, verifyPin } from './utils/pin-hash';

interface StaffRow {
  id: number;
  name: string;
  pin: string;
  role: string;
  is_active: number;
  created_at: string;
}

export function registerStaffIPC() {
  ipcMain.handle('staff:login', async (_event, payload: { pin: string }) => {
    try {
      const db = getDB();
      const users = db.prepare('SELECT * FROM staff WHERE is_active = 1').all() as StaffRow[];
      const user = users.find(u => verifyPin(payload.pin, u.pin));
      if (!user) {
        return { success: false, error: 'Invalid PIN' };
      }
      // Upgrade plaintext PIN to hash on first successful login
      if (!user.pin.startsWith('scrypt:')) {
        db.prepare('UPDATE staff SET pin = ? WHERE id = ?').run(hashPin(payload.pin), user.id);
      }
      const { pin: _pin, ...safeUser } = user;
      return { success: true, data: safeUser };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

  ipcMain.handle('staff:getAll', async () => {
    try {
      const db = getDB();
      const staff = db.prepare('SELECT id, name, role, is_active, created_at FROM staff').all();
      return { success: true, data: staff };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

  ipcMain.handle('staff:upsert', async (_event, payload: { id?: number; name: string; pin?: string; role: string }) => {
    try {
      const db = getDB();
      if (payload.id) {
        if (payload.pin) {
          db.prepare('UPDATE staff SET name = ?, pin = ?, role = ? WHERE id = ?').run(
            payload.name, hashPin(payload.pin), payload.role, payload.id
          );
        } else {
          db.prepare('UPDATE staff SET name = ?, role = ? WHERE id = ?').run(payload.name, payload.role, payload.id);
        }
        return { success: true, data: { id: payload.id } };
      }
      const info = db.prepare('INSERT INTO staff (name, pin, role) VALUES (?, ?, ?)').run(
        payload.name, hashPin(payload.pin ?? ''), payload.role
      );
      return { success: true, data: { id: info.lastInsertRowid } };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

  ipcMain.handle('staff:delete', async (_event, payload: { id: number }) => {
    try {
      const db = getDB();
      const info = db.prepare('UPDATE staff SET is_active = 0 WHERE id = ?').run(payload.id);
      if (info.changes > 0) {
        return { success: true };
      }
      return { success: false, error: 'Staff not found' };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

  ipcMain.handle('staff:changePin', async (_event, payload: { id: number; currentPin: string; newPin: string }) => {
    try {
      const db = getDB();
      const user = db.prepare('SELECT pin FROM staff WHERE id = ?').get(payload.id) as { pin: string } | undefined;
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      if (!verifyPin(payload.currentPin, user.pin)) {
        return { success: false, error: 'Current PIN is incorrect' };
      }
      db.prepare('UPDATE staff SET pin = ? WHERE id = ?').run(hashPin(payload.newPin), payload.id);
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  });
}
