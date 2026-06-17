import { ipcMain } from 'electron';

export function registerReportsIPC() {
  ipcMain.handle('reports:daily', async () => ({ success: true }));
  ipcMain.handle('reports:gst', async () => ({ success: true }));
}
