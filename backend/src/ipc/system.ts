import { ipcMain, app } from 'electron';
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
}
