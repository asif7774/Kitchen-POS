import { describe, it, expect } from 'vitest';
import { computeBillTotals, OrderItemInput, DISCOUNT_APPLICATION } from './billing-totals';
import { renderSummary, BillPrintPayload } from './printer';

/**
 * The defect these tests lock down:
 *
 * computeBillTotals became the single authority for bill figures, but the
 * receipt still laid its summary out as Subtotal / CGST / SGST / Discount. Under
 * a pre-tax discount the stored taxable_amount is already net of the discount,
 * so that layout deducted it a second time: a 1000 bill with a 100 discount
 * across mixed rates printed rows that read 903.50 beside a GRAND TOTAL of
 * 1003.50. The grand total was right — the breakdown beneath it was not, and on
 * a GST invoice the taxable value and the discount both have to be stated
 * correctly.
 *
 * The rule: the rows a customer can add up must reconcile to the grand total.
 */

/** Pulls the figures back out of the rendered rows, as a reader of the receipt would. */
function readRows(html: string): { label: string; amount: number }[] {
  return [...html.matchAll(/<span>([^<]*?):<\/span><span>-?₹([\d.]+)<\/span>/g)].map(m => ({
    label: m[1],
    amount: (m[0].includes('>-₹') ? -1 : 1) * Number(m[2]),
  }));
}

function billFrom(items: OrderItemInput[], discount: number, isGstEnabled = true): BillPrintPayload {
  const t = computeBillTotals(items, discount, isGstEnabled);
  return {
    bill_number: 'INV-2026-0001',
    taxable_amount: t.taxable_amount,
    cgst_amount: t.cgst_amount,
    sgst_amount: t.sgst_amount,
    discount_amount: t.discount_amount,
    total_amount: t.total_amount,
  };
}

/** 500 at 5% plus 500 at 18% — mixed rates, so a blended rate would be visibly wrong. */
const mixedRates: OrderItemInput[] = [
  { id: 1, unit_price: 500, qty: 1, cgst_rate: 2.5, sgst_rate: 2.5 },
  { id: 2, unit_price: 500, qty: 1, cgst_rate: 9, sgst_rate: 9 },
];

describe('printed bill summary', () => {
  it('reconciles to the grand total on the worked example', () => {
    const bill = billFrom(mixedRates, 100);
    const rows = readRows(renderSummary(bill, true));

    expect(bill.total_amount).toBe(1003.5);
    // Subtotal 1000, Discount -100, Taxable 900 — the taxable row restates the
    // subtotal net of discount, so it is not part of the running sum.
    const sum = rows
      .filter(r => r.label !== 'Taxable Amount')
      .reduce((a, r) => a + r.amount, 0);
    expect(Number(sum.toFixed(2))).toBe(bill.total_amount);
  });

  it('reconciles across discounts, rates and GST being off', () => {
    const cases: [OrderItemInput[], number, boolean][] = [
      [mixedRates, 0, true],
      [mixedRates, 1, true],
      [mixedRates, 333.33, true],
      [mixedRates, 1000, true],
      [mixedRates, 5000, true], // clamped to the subtotal
      [mixedRates, 100, false],
      [[{ id: 1, unit_price: 99.99, qty: 3, cgst_rate: 9, sgst_rate: 9 }], 50, true],
    ];

    for (const [items, discount, gst] of cases) {
      const bill = billFrom(items, discount, gst);
      const rows = readRows(renderSummary(bill, gst));
      const sum = rows
        .filter(r => r.label !== 'Taxable Amount')
        .reduce((a, r) => a + r.amount, 0);
      expect(Number(sum.toFixed(2)), `discount ${discount}, gst ${gst}`).toBe(bill.total_amount);
    }
  });

  it('states the discount exactly once', () => {
    const rows = readRows(renderSummary(billFrom(mixedRates, 100), true));
    expect(rows.filter(r => r.label === 'Discount')).toHaveLength(1);
  });

  it('omits the discount rows when nothing was discounted', () => {
    const rows = readRows(renderSummary(billFrom(mixedRates, 0), true));
    expect(rows.map(r => r.label)).toEqual(['Subtotal', 'CGST', 'SGST']);
  });

  it('omits the tax rows when GST is disabled', () => {
    const rows = readRows(renderSummary(billFrom(mixedRates, 100, false), false));
    expect(rows.map(r => r.label)).not.toContain('CGST');
  });

  it('puts the discount on the side of tax that it was applied on', () => {
    const labels = readRows(renderSummary(billFrom(mixedRates, 100), true)).map(r => r.label);
    const discountBeforeTax = labels.indexOf('Discount') < labels.indexOf('CGST');
    expect(discountBeforeTax).toBe(DISCOUNT_APPLICATION === 'pre-tax');
  });
});
