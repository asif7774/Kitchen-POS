import { ipcMain } from 'electron';
import { createBill } from '../services/billing';

interface PaymentPayload {
  method: string;
  amount: number;
  reference?: string;
}

interface CreateBillPayload {
  orderId: number;
  payments: PaymentPayload[];
  discount?: number;
  customerId?: number;
}

export function registerBillingIPC() {
  ipcMain.handle('billing:createBill', async (_, payload: CreateBillPayload) => {
    try {
      const res = createBill(payload.orderId, payload.payments, payload.discount ?? 0, payload.customerId);
      return { success: true, data: res };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error occurred' };
    }
  });

  ipcMain.handle('billing:getBill', async () => ({ success: true }));
}
