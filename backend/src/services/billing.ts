import Store from 'electron-store';
import { getDB } from '../db';
import { calcBillTotals, OrderItem } from './gst';

const store = new Store();

interface PaymentPayload {
  method: string;
  amount: number;
  reference?: string;
}

export function createBill(orderId: number, payments: PaymentPayload[], discount: number, customerId?: number) {
  const db = getDB();

  const result = db.transaction(() => {
    // Guard: prevent double-billing if the user submits twice
    const orderStatus = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId) as { status: string } | undefined;
    if (!orderStatus) { throw new Error('Order not found.'); }
    if (orderStatus.status === 'billed') { throw new Error('This order has already been billed.'); }

    // Generate bill number atomically inside the transaction so concurrent calls
    // never see the same counter value (SQLite serializes writes).
    const year = new Date().getFullYear();
    const maxRow = db.prepare(
      `SELECT COALESCE(MAX(CAST(REPLACE(bill_number, 'INV-${year}-', '') AS INTEGER)), 0) as max_num FROM bills WHERE bill_number LIKE 'INV-${year}-%'`
    ).get() as { max_num: number };
    const billNumber = `INV-${year}-${(maxRow.max_num + 1).toString().padStart(4, '0')}`;

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as OrderItem[];
    const isGstEnabled = store.get('is_gst_enabled', true) as boolean;
    const totals = calcBillTotals(items, isGstEnabled);

    totals.discount_amount += discount;
    totals.total_amount = Math.round((totals.total_amount - discount) * 100) / 100;

    const orderRow = db.prepare('SELECT business_date FROM orders WHERE id = ?').get(orderId) as { business_date: string | null };

    const info = db.prepare(`
      INSERT INTO bills (bill_number, order_id, taxable_amount, cgst_amount, sgst_amount, discount_amount, total_amount, customer_id, business_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(billNumber, orderId, totals.taxable_amount, totals.cgst_amount, totals.sgst_amount, totals.discount_amount, totals.total_amount, customerId ?? null, orderRow.business_date ?? null);

    for (const p of payments) {
      db.prepare(`INSERT INTO payments (order_id, method, amount, reference) VALUES (?, ?, ?, ?)`).run(orderId, p.method, p.amount, p.reference ?? null);
      if (p.method === 'unpaid') {
        if (!customerId) { throw new Error('Customer must be selected for unpaid balances.'); }
        db.prepare('UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?').run(p.amount, customerId);
      }
    }

    db.prepare('UPDATE orders SET status = ?, customer_id = ? WHERE id = ?').run('billed', customerId ?? null, orderId);

    const orderRecord = db.prepare('SELECT table_id FROM orders WHERE id = ?').get(orderId) as { table_id: number } | undefined;
    if (orderRecord?.table_id) {
      db.prepare('UPDATE tables SET custom_name = NULL WHERE id = ?').run(orderRecord.table_id);
    }

    return {
      billId: info.lastInsertRowid,
      bill_number: billNumber,
      taxable_amount: totals.taxable_amount,
      cgst_amount: totals.cgst_amount,
      sgst_amount: totals.sgst_amount,
      discount_amount: totals.discount_amount,
      total_amount: totals.total_amount,
    };
  })();

  return result;
}
