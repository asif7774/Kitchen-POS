import { ipcMain, app, dialog } from 'electron';
import Store from 'electron-store';
import { getDB, closeDB } from '../db';
import * as path from 'path';
import * as fs from 'fs';

const store = new Store();

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error occurred';
}

export function registerSystemIPC() {
  ipcMain.handle('system:isSetupComplete', async () => {
    try {
      const isComplete = store.get('is_setup_complete', false);
      return { success: true, data: isComplete };
    } catch (e) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('system:completeSetup', async (_, payload: { restaurantName: string; adminName: string; adminPin: string }) => {
    try {
      const db = getDB();
      db.prepare('UPDATE staff SET name = ?, pin = ? WHERE role = "admin"').run(payload.adminName, payload.adminPin);
      
      store.set('outlet_name', payload.restaurantName);
      store.set('is_setup_complete', true);

      return { success: true };
    } catch (e) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('system:factoryReset', async () => {
    try {
      // 1. Close DB connection
      closeDB();

      // 2. Clear store
      store.clear();

      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'pos.db');
      const dbShmPath = path.join(userDataPath, 'pos.db-shm');
      const dbWalPath = path.join(userDataPath, 'pos.db-wal');
      const imagesPath = path.join(userDataPath, 'images');

      if (fs.existsSync(dbPath)) { fs.unlinkSync(dbPath); }
      if (fs.existsSync(dbShmPath)) { fs.unlinkSync(dbShmPath); }
      if (fs.existsSync(dbWalPath)) { fs.unlinkSync(dbWalPath); }

      // 4. Delete images directory
      if (fs.existsSync(imagesPath)) {
        fs.rmSync(imagesPath, { recursive: true, force: true });
      }

      // 5. Relaunch
      app.relaunch();
      app.exit(0);

      return { success: true };
    } catch (e) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('system:generateRecoveryCode', async () => {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save Recovery Code',
        defaultPath: 'kitchen-pos-recovery-code.txt',
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Cancelled' };
      }

      const content = `KITCHEN-POS RECOVERY CODE\n-------------------------\nKeep this code safe. If you forget your PIN, you can use this code to reset the Admin PIN.\n\nRecovery Code: ${code}\n`;
      fs.writeFileSync(filePath, content, 'utf-8');

      store.set('recovery_code', code);

      return { success: true };
    } catch (e) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('system:verifyRecoveryCode', async (_, payload: { code: string }) => {
    try {
      const storedCode = store.get('recovery_code') as string | undefined;
      if (storedCode && storedCode === payload.code.trim().toUpperCase()) {
        return { success: true };
      }
      return { success: false, error: 'Invalid recovery code' };
    } catch (e) {
      return { success: false, error: errMsg(e) };
    }
  });

  ipcMain.handle('system:resetAdminPin', async (_, payload: { newPin: string; code: string }) => {
    try {
      const storedCode = store.get('recovery_code') as string | undefined;
      if (!storedCode || storedCode !== payload.code.trim().toUpperCase()) {
        return { success: false, error: 'Invalid recovery code' };
      }

      const db = getDB();
      db.prepare('UPDATE staff SET pin = ? WHERE role = "admin"').run(payload.newPin);
      
      return { success: true };
    } catch (e) {
      return { success: false, error: errMsg(e) };
    }
  });
}
