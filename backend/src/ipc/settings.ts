import { ipcMain } from 'electron';
import Store from 'electron-store';

const store = new Store();

export function registerSettingsIPC() {
  ipcMain.handle('settings:get', async () => ({ success: true, data: store.store }));
  
  ipcMain.handle('settings:save', async (_, payload: Record<string, any>) => {
    try {
      for (const [key, value] of Object.entries(payload)) {
        store.set(key, value);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}

export function getSetting<T>(key: string, defaultValue: T): T {
  return store.get(key, defaultValue) as T;
}
