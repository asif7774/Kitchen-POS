import { ipcMain, dialog, app } from 'electron';
import { getDB } from '../db';
import * as fs from 'fs';
import * as path from 'path';
import Store from 'electron-store';
import { pruneOldBackups, formatLocalDate, checkShouldFireReminder, type BackupReminderConfig } from './backup-utils';
import archiver from 'archiver';
import extractZip from 'extract-zip';

interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  path: string | null;
  dayOfWeek: number;
  lastBackupAt: string | null;
}

const DEFAULT_AUTO_BACKUP: AutoBackupConfig = {
  enabled: false,
  frequency: 'daily',
  path: null,
  dayOfWeek: 1,
  lastBackupAt: null,
};

const DEFAULT_REMINDER: BackupReminderConfig = {
  enabled: false,
  frequency: 'daily',
  time: '20:00',
  dayOfWeek: 1,
  dayOfMonth: 1,
  lastRemindedDate: null,
};

export async function performAutoBackup(): Promise<void> {
  const store = new Store();
  const config = store.get('autoBackup', DEFAULT_AUTO_BACKUP) as AutoBackupConfig;
  if (!config.enabled) { return; }

  const now = new Date();
  if (config.frequency === 'weekly' && now.getDay() !== config.dayOfWeek) { return; }

  const db = getDB();
  const backupDir = config.path ?? app.getPath('userData');
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(backupDir, `kitchen-pos-backup-${ts}.zip`);
  const tempDbPath = path.join(app.getPath('temp'), `pos-temp-${Date.now()}.db`);

  try {
    await db.backup(tempDbPath);
    
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(backupPath);
      const createArchive = archiver as any;
      const archive = createArchive('zip', { zlib: { level: 9 } });
      output.on('close', () => { resolve(); });
      archive.on('error', (err: Error) => { reject(err); });
      
      archive.pipe(output);
      archive.file(tempDbPath, { name: 'pos.db' });
      
      const imagesDir = path.join(app.getPath('userData'), 'images');
      if (fs.existsSync(imagesDir)) {
        archive.directory(imagesDir, 'images');
      }
      
      void archive.finalize();
    });

    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }

    store.set('autoBackup', { ...config, lastBackupAt: now.toISOString() });
    pruneOldBackups(backupDir, 7);
  } catch (e: unknown) {
    if (fs.existsSync(tempDbPath)) {
      try { fs.unlinkSync(tempDbPath); } catch (_err) { /* ignore */ }
    }
    console.error('Auto-backup failed:', e instanceof Error ? e.message : e);
  }
}

export function shouldFireReminder(): boolean {
  const store = new Store();
  const config = store.get('backupReminder', DEFAULT_REMINDER) as BackupReminderConfig;
  return checkShouldFireReminder(config, new Date());
}

export function markReminderFired(): void {
  const store = new Store();
  const config = store.get('backupReminder', DEFAULT_REMINDER) as BackupReminderConfig;
  const todayStr = formatLocalDate(new Date());
  store.set('backupReminder', { ...config, lastRemindedDate: todayStr });
}

export function registerBackupIPC() {
  ipcMain.handle('backup:export', async () => {
    let tempDbPath: string | null = null;
    try {
      const db = getDB();
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export Full Backup (ZIP)',
        defaultPath: 'kitchen-pos-backup.zip',
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Export cancelled' };
      }

      tempDbPath = path.join(app.getPath('temp'), `pos-temp-${Date.now()}.db`);
      await db.backup(tempDbPath);

      await new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(filePath);
        const createArchive = archiver as any;
        const archive = createArchive('zip', { zlib: { level: 9 } });
        output.on('close', () => { resolve(); });
        archive.on('error', (err: Error) => { reject(err); });
        
        archive.pipe(output);
        if (tempDbPath) {
          archive.file(tempDbPath, { name: 'pos.db' });
        }
        
        const imagesDir = path.join(app.getPath('userData'), 'images');
        if (fs.existsSync(imagesDir)) {
          archive.directory(imagesDir, 'images');
        }
        
        void archive.finalize();
      });

      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }

      return { success: true, data: filePath };
    } catch (e: unknown) {
      if (tempDbPath && fs.existsSync(tempDbPath)) {
        try { fs.unlinkSync(tempDbPath); } catch (_err) { /* ignore */ }
      }
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('backup:import', async () => {
    let extractDir: string | null = null;
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import Full Backup (ZIP)',
        properties: ['openFile'],
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'Import cancelled' };
      }

      const importedZip = filePaths[0];
      extractDir = path.join(app.getPath('temp'), `pos-extract-${Date.now()}`);
      
      await extractZip(importedZip, { dir: extractDir });

      const extractedDbPath = path.join(extractDir, 'pos.db');
      if (!fs.existsSync(extractedDbPath)) {
        return { success: false, error: 'Selected ZIP does not contain pos.db' };
      }

      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(extractedDbPath, 'r');
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);

      if (!buffer.toString('utf8').startsWith('SQLite format 3')) {
        return { success: false, error: 'The pos.db inside the zip is not a valid SQLite database' };
      }

      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'pos.db');

      const db = getDB();
      db.close();

      fs.copyFileSync(extractedDbPath, dbPath);

      // Copy images folder if it exists
      const extractedImagesDir = path.join(extractDir, 'images');
      const destImagesDir = path.join(userDataPath, 'images');
      if (fs.existsSync(extractedImagesDir)) {
        if (!fs.existsSync(destImagesDir)) {
          fs.mkdirSync(destImagesDir, { recursive: true });
        }
        const copyRecursiveSync = (src: string, dest: string) => {
          const exists = fs.existsSync(src);
          const stats = exists && fs.statSync(src);
          const isDirectory = exists && stats && stats.isDirectory();
          if (isDirectory) {
            if (!fs.existsSync(dest)) { fs.mkdirSync(dest); }
            fs.readdirSync(src).forEach(childItemName => {
              copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
            });
          } else {
            fs.copyFileSync(src, dest);
          }
        };
        copyRecursiveSync(extractedImagesDir, destImagesDir);
      }

      const walPath = `${dbPath}-wal`;
      const shmPath = `${dbPath}-shm`;
      if (fs.existsSync(walPath)) { fs.unlinkSync(walPath); }
      if (fs.existsSync(shmPath)) { fs.unlinkSync(shmPath); }

      app.relaunch();
      app.quit();

      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    } finally {
      if (extractDir && fs.existsSync(extractDir)) {
        try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch (_err) { /* ignore */ }
      }
    }
  });

  ipcMain.handle('backup:getAutoBackupConfig', async () => {
    const store = new Store();
    return {
      success: true,
      data: {
        autoBackup: store.get('autoBackup', DEFAULT_AUTO_BACKUP) as AutoBackupConfig,
        backupReminder: store.get('backupReminder', DEFAULT_REMINDER) as BackupReminderConfig,
      }
    };
  });

  ipcMain.handle('backup:setAutoBackupConfig', async (_, payload: { autoBackup?: Partial<AutoBackupConfig>; backupReminder?: Partial<BackupReminderConfig> }) => {
    try {
      const store = new Store();
      if (payload.autoBackup) {
        const current = store.get('autoBackup', DEFAULT_AUTO_BACKUP) as AutoBackupConfig;
        store.set('autoBackup', { ...current, ...payload.autoBackup });
      }
      if (payload.backupReminder) {
        const current = store.get('backupReminder', DEFAULT_REMINDER) as BackupReminderConfig;
        store.set('backupReminder', { ...current, ...payload.backupReminder });
      }
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  });

  ipcMain.handle('backup:selectAutoBackupPath', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select Auto-Backup Folder',
        properties: ['openDirectory', 'createDirectory'],
      });
      if (canceled || filePaths.length === 0) { return { success: false, error: 'Cancelled' }; }
      return { success: true, data: filePaths[0] };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  });

  ipcMain.handle('backup:triggerNow', async () => {
    try {
      await performAutoBackup();
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  });
}
