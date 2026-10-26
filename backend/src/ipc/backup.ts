import { ipcMain, dialog, app } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { pruneOldBackups, formatLocalDate, checkShouldFireReminder } from './backup-utils';
import { backupService } from '../services/backupService';
import { AutoBackupConfig, BackupReminderConfig } from '../types/backup';

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

  const backupDir = config.path ?? app.getPath('userData');
  const pad = (n: number) => n.toString().padStart(2, '0');
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
  const rawRestaurantName = (store.get('restaurant_name') as string) || 'Kitchen';
  const restaurantName = rawRestaurantName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'Kitchen';
  const backupPath = path.join(backupDir, `${restaurantName}-POS-backup-${ts}.zip`);

  try {
    await backupService.exportBackup(backupPath);
    store.set('autoBackup', { ...config, lastBackupAt: now.toISOString() });
    pruneOldBackups(backupDir, 7);
  } catch (e: unknown) {
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
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export Full Backup (ZIP)',
        defaultPath: `${((new Store().get('restaurant_name') as string) || 'Kitchen').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'Kitchen'}-POS-backup.zip`,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Export cancelled' };
      }

      await backupService.exportBackup(filePath);
      return { success: true, data: filePath };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('backup:import', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import Full Backup (ZIP)',
        properties: ['openFile'],
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'Import cancelled' };
      }

      await backupService.importBackup(filePaths[0]);

      app.relaunch();
      app.quit();

      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('backup:getAutoBackupConfig', async () => {
    return {
      success: true,
      data: backupService.getAutoBackupConfig()
    };
  });

  ipcMain.handle('backup:setAutoBackupConfig', async (_, payload: { autoBackup?: Partial<AutoBackupConfig>; backupReminder?: Partial<BackupReminderConfig> }) => {
    try {
      backupService.setAutoBackupConfig(payload);
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
