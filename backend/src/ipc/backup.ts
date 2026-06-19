import { ipcMain, dialog, app } from 'electron';
import { getDB } from '../db';
import * as fs from 'fs';
import * as path from 'path';
import Store from 'electron-store';

interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  path: string | null;
  dayOfWeek: number;
  lastBackupAt: string | null;
}

interface BackupReminderConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek: number;
  dayOfMonth: number;
  lastRemindedDate: string | null;
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

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function pruneOldBackups(dir: string, keepCount: number): void {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => /^kitchen-pos-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.db$/.test(f))
      .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);
    files.slice(keepCount).forEach(f => {
      try { fs.unlinkSync(path.join(dir, f.name)); } catch { /* ignore unlink errors */ }
    });
  } catch (e: unknown) {
    console.error('Failed to prune backups:', e instanceof Error ? e.message : e);
  }
}

export async function performAutoBackup(): Promise<void> {
  const store = new Store();
  const config = store.get('autoBackup', DEFAULT_AUTO_BACKUP) as AutoBackupConfig;
  if (!config.enabled) { return; }

  const now = new Date();
  if (config.frequency === 'weekly' && now.getDay() !== config.dayOfWeek) { return; }

  const db = getDB();
  const backupDir = config.path ?? app.getPath('userData');
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(backupDir, `kitchen-pos-backup-${ts}.db`);

  try {
    await db.backup(backupPath);
    store.set('autoBackup', { ...config, lastBackupAt: now.toISOString() });
    pruneOldBackups(backupDir, 7);
  } catch (e: unknown) {
    console.error('Auto-backup failed:', e instanceof Error ? e.message : e);
  }
}

export function shouldFireReminder(): boolean {
  const store = new Store();
  const config = store.get('backupReminder', DEFAULT_REMINDER) as BackupReminderConfig;
  if (!config.enabled) { return false; }

  const now = new Date();
  const todayStr = formatLocalDate(now);
  if (config.lastRemindedDate === todayStr) { return false; }

  const [configH, configM] = config.time.split(':').map(Number);
  const timeMatch = now.getHours() === configH && now.getMinutes() === configM;
  if (!timeMatch) { return false; }

  if (config.frequency === 'daily') { return true; }
  if (config.frequency === 'weekly') { return now.getDay() === config.dayOfWeek; }
  // monthly
  return now.getDate() === config.dayOfMonth;
}

export function markReminderFired(): void {
  const store = new Store();
  const config = store.get('backupReminder', DEFAULT_REMINDER) as BackupReminderConfig;
  const todayStr = formatLocalDate(new Date());
  store.set('backupReminder', { ...config, lastRemindedDate: todayStr });
}

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
