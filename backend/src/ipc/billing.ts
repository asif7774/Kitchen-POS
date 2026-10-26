import { ipcMain } from 'electron';
import { createBill, previewBill } from '../services/billing';

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

interface PreviewBillPayload {
  orderId: number;
  discount?: number;
}

export function registerBillingIPC() {
  // Computes what the bill comes to without committing it. The renderer shows
  // these figures and validates payment against them, so what is displayed is
  // always what createBill will charge.
  ipcMain.handle('billing:preview', async (_, payload: PreviewBillPayload) => {
    try {
      return { success: true, data: previewBill(payload.orderId, payload.discount ?? 0) };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error occurred' };
    }
  });

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
