import { ipcMain } from 'electron';
import { createBill } from '../services/billing';

export function registerBillingIPC() {
  ipcMain.handle('billing:createBill', async (event, payload) => {
    try {
      const { orderId, payments, discount } = payload;
      const res = createBill(orderId, payments, discount ?? 0);
      return { success: true, data: res };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('billing:getBill', async () => ({ success: true }));
}
