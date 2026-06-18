import { ipcMain, dialog, app } from 'electron';
import { getDB } from '../db';
import * as fs from 'fs';
import * as path from 'path';

export function registerBackupIPC() {
  ipcMain.handle('backup:export', async () => {
    try {
      const db = getDB();
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export Database Backup',
        defaultPath: 'kitchen-pos-backup.db',
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Export cancelled' };
      }

      await db.backup(filePath);
      return { success: true, data: filePath };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('backup:import', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import Database Backup',
        properties: ['openFile'],
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'Import cancelled' };
      }

      const importedFile = filePaths[0];
      
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(importedFile, 'r');
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);
      
      if (!buffer.toString('utf8').startsWith('SQLite format 3')) {
        return { success: false, error: 'Selected file is not a valid SQLite database' };
      }

      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'pos.db');

      const db = getDB();
      db.close();
      
      fs.copyFileSync(importedFile, dbPath);
      
      const walPath = `${dbPath  }-wal`;
      const shmPath = `${dbPath  }-shm`;
      if (fs.existsSync(walPath)) {fs.unlinkSync(walPath);}
      if (fs.existsSync(shmPath)) {fs.unlinkSync(shmPath);}

      app.relaunch();
      app.quit();

      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });
}
