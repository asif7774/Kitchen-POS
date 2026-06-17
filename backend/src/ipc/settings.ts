import { ipcMain } from 'electron';

export function registerSettingsIPC() {
  ipcMain.handle('settings:get', async () => ({ success: true, data: {} }));
  ipcMain.handle('settings:save', async () => ({ success: true }));
}
