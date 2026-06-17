import { ipcMain } from 'electron';
import { printKOT, printBill } from '../services/printer';

interface KOTPayload {
  items: Array<{ name: string; qty: number }>;
  tableName: string;
  orderNote: string;
}

interface BillPayload {
  bill: {
    bill_number: string;
    taxable_amount: number;
    cgst_amount: number;
    sgst_amount: number;
    discount_amount: number;
    total_amount: number;
  };
  orderItems: Array<{ name: string; qty: number; unit_price: number }>;
  settings: {
    outlet_name?: string;
    address?: string;
    gstin?: string;
  };
}

export function registerPrinterIPC() {
  ipcMain.handle('print:kot', async (_, payload: KOTPayload) => {
    try {
      await printKOT(payload.items, payload.tableName, payload.orderNote);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown printing error' };
    }
  });

  ipcMain.handle('print:bill', async (_, payload: BillPayload) => {
    try {
      await printBill(payload.bill, payload.orderItems, payload.settings);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown printing error' };
    }
  });
}
