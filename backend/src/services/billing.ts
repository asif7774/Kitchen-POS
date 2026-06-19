import Store from 'electron-store';
import { getDB } from '../db';
import { calcBillTotals, OrderItem } from './gst';

const store = new Store();

interface PaymentPayload {
  method: string;
  amount: number;
  reference?: string;
}

export function getNextBillNumber(): string {
  const lastNumber = store.get('last_bill_number', 0) as number;
  const year = new Date().getFullYear();
  return `INV-${year}-${(lastNumber + 1).toString().padStart(4, '0')}`;
}

export function createBill(orderId: number, payments: PaymentPayload[], discount: number, customerId?: number) {
  const db = getDB();

  // Read bill number and settings before entering the transaction (no file I/O inside SQLite tx)
  const billNumber = getNextBillNumber();

  const result = db.transaction(() => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as OrderItem[];
    const totals = calcBillTotals(items);

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

  // Persist incremented counter after the DB transaction succeeds
  const lastNumber = store.get('last_bill_number', 0) as number;
  store.set('last_bill_number', lastNumber + 1);

  return result;
}
