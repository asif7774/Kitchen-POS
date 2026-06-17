import { ipcMain } from 'electron';
import { printKOT, printBill } from '../services/printer';

export function registerPrinterIPC() {
  ipcMain.handle('print:kot', async (event, payload) => {
    try {
      await printKOT(payload.items, payload.tableName, payload.orderNote);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('print:bill', async (event, payload) => {
    try {
      await printBill(payload.bill, payload.orderItems, payload.settings);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}
