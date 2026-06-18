import Store from 'electron-store';
import { getDB } from '../db';
import { calcBillTotals, OrderItem } from './gst';

const store = new Store();

export function getNextBillNumber(): string {
  const lastNumber = store.get('last_bill_number', 0) as number;
  const nextNumber = lastNumber + 1;
  const year = new Date().getFullYear();
  return `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

export function createBill(orderId: number, payments: any[], discount: number, customerId?: number) {
  const db = getDB();

  const transaction = db.transaction(() => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as OrderItem[];
    // Apply discount proportional or whatever logic needed, for now just simple overall via items if logic dictates,
    // assuming discount given is split or total. Simplistic total:
    const totals = calcBillTotals(items);
    
    // adjust total for bill level discount if needed
    totals.discount_amount += discount;
    totals.total_amount -= discount;

    const billNumber = getNextBillNumber();

    const insertBill = db.prepare(`
      INSERT INTO bills (bill_number, order_id, taxable_amount, cgst_amount, sgst_amount, discount_amount, total_amount, customer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = insertBill.run(
      billNumber, orderId, totals.taxable_amount, totals.cgst_amount, totals.sgst_amount, totals.discount_amount, totals.total_amount, customerId ?? null
    );

    const insertPayment = db.prepare(`
      INSERT INTO payments (order_id, method, amount, reference)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const p of payments) {
      insertPayment.run(orderId, p.method, p.amount, p.reference ?? null);
      if (p.method === 'unpaid') {
        if (!customerId) {
          throw new Error('Customer must be selected for unpaid balances.');
        }
        db.prepare('UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?').run(p.amount, customerId);
      }
    }

    db.prepare('UPDATE orders SET status = ?, customer_id = ? WHERE id = ?').run('billed', customerId ?? null, orderId);

    // Save incremented counter
    const lastNumber = store.get('last_bill_number', 0) as number;
    store.set('last_bill_number', lastNumber + 1);

    return { 
      billId: info.lastInsertRowid, 
      bill_number: billNumber,
      taxable_amount: totals.taxable_amount,
      cgst_amount: totals.cgst_amount,
      sgst_amount: totals.sgst_amount,
      discount_amount: totals.discount_amount,
      total_amount: totals.total_amount
    };
  });

  return transaction();
}
