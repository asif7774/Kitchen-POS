import { ipcMain } from 'electron';

export function registerBackupIPC() {
  ipcMain.handle('backup:export', async () => ({ success: true }));
  ipcMain.handle('backup:import', async () => ({ success: true }));
}
