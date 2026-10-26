import { describe, it, expect } from 'vitest';
import { computeBillTotals, OrderItemInput } from './billing-totals';

/**
 * The defect these tests lock down:
 *
 * The renderer hardcoded a 2.5% GST rate and applied the discount before tax,
 * while the main process read per-item rates and applied the discount after tax.
 * A 1000 order with a 100 discount therefore showed 945.00 on screen while the
 * receipt and the bills row both said 950.00 — staff collected an amount that did
 * not match the receipt, and the stored CGST/SGST was tax on a base nobody paid.
 *
 * Every figure now comes from computeBillTotals. These tests state what it yields
 * under each discount ordering, so the choice in DISCOUNT_APPLICATION can be
 * changed without anyone having to re-derive the arithmetic.
 */

const gst5 = (unit_price: number, qty = 1, id = 1): OrderItemInput => ({
  id,
  unit_price,
  qty,
  cgst_rate: 2.5,
  sgst_rate: 2.5,
});

const gst18 = (unit_price: number, qty = 1, id = 1): OrderItemInput => ({
  id,
  unit_price,
  qty,
  cgst_rate: 9,
  sgst_rate: 9,
});

describe('computeBillTotals — the reported bug', () => {
  const items = [gst5(1000)];

  it('pre-tax: a 100 discount on a 1000 order at 5% GST totals 945.00', () => {
    const t = computeBillTotals(items, 100, true, 'pre-tax');
    expect(t.taxable_amount).toBe(900);
    expect(t.cgst_amount).toBe(22.5);
    expect(t.sgst_amount).toBe(22.5);
    expect(t.discount_amount).toBe(100);
    expect(t.total_amount).toBe(945);
  });

  it('post-tax: the same order totals 950.00', () => {
    const t = computeBillTotals(items, 100, true, 'post-tax');
    expect(t.taxable_amount).toBe(1000);
    expect(t.cgst_amount).toBe(25);
    expect(t.sgst_amount).toBe(25);
    expect(t.discount_amount).toBe(100);
    expect(t.total_amount).toBe(950);
  });

  it('the two orderings genuinely differ — this is the 5.00 discrepancy', () => {
    const pre = computeBillTotals(items, 100, true, 'pre-tax');
    const post = computeBillTotals(items, 100, true, 'post-tax');
    expect(post.total_amount - pre.total_amount).toBe(5);
  });
});

describe('computeBillTotals — per-item rates', () => {
  it('honours a non-default rate instead of assuming 2.5%', () => {
    const t = computeBillTotals([gst18(1000)], 0, true, 'pre-tax');
    expect(t.cgst_amount).toBe(90);
    expect(t.sgst_amount).toBe(90);
    expect(t.total_amount).toBe(1180);
  });

  it('charges no tax when GST is disabled', () => {
    const t = computeBillTotals([gst18(1000)], 0, false, 'pre-tax');
    expect(t.cgst_amount).toBe(0);
    expect(t.sgst_amount).toBe(0);
    expect(t.total_amount).toBe(1000);
  });
});

describe('computeBillTotals — mixed rates, pro-rata allocation', () => {
  // 600 at 5% + 400 at 18%, 100 off the bill.
  // Shares: 60 and 40. Bases: 540 and 360.
  const items = [gst5(600, 1, 1), gst18(400, 1, 2)];

  it('splits the discount in proportion to line value', () => {
    const t = computeBillTotals(items, 100, true, 'pre-tax');
    expect(t.lines[0].taxable_amount).toBe(540);
    expect(t.lines[1].taxable_amount).toBe(360);
  });

  it('taxes each line at its own rate after its share is removed', () => {
    const t = computeBillTotals(items, 100, true, 'pre-tax');
    expect(t.lines[0].cgst_amount).toBe(13.5);
    expect(t.lines[1].cgst_amount).toBe(32.4);
    expect(t.cgst_amount).toBe(45.9);
    expect(t.sgst_amount).toBe(45.9);
    expect(t.total_amount).toBe(991.8);
  });

  it('line figures sum to the bill figures', () => {
    const t = computeBillTotals(items, 100, true, 'pre-tax');
    const sum = (k: 'taxable_amount' | 'cgst_amount' | 'sgst_amount') =>
      Math.round(t.lines.reduce((a, l) => a + l[k], 0) * 100) / 100;
    expect(sum('taxable_amount')).toBe(t.taxable_amount);
    expect(sum('cgst_amount')).toBe(t.cgst_amount);
    expect(sum('sgst_amount')).toBe(t.sgst_amount);
  });
});

describe('computeBillTotals — rounding', () => {
  it('assigns the residual paise so the allocation equals the discount exactly', () => {
    // Three lines of 100, 10 off. Each share is 3.333…, rounding to 3.33 and
    // leaving 0.01 unallocated. The remainder goes to the largest line, ties
    // broken by lowest id, so the discount is never silently short.
    const items = [gst5(100, 1, 1), gst5(100, 1, 2), gst5(100, 1, 3)];
    const t = computeBillTotals(items, 10, true, 'pre-tax');

    const allocated = t.lines.map((l) => Math.round((100 - l.taxable_amount) * 100) / 100);
    expect(allocated).toEqual([3.34, 3.33, 3.33]);
    expect(Math.round(allocated.reduce((a, b) => a + b, 0) * 100) / 100).toBe(10);
    expect(t.discount_amount).toBe(10);
  });
});

describe('computeBillTotals — discount bounds', () => {
  it('clamps a discount larger than the subtotal, giving a zero total', () => {
    const t = computeBillTotals([gst5(500)], 900, true, 'pre-tax');
    expect(t.discount_amount).toBe(500);
    expect(t.taxable_amount).toBe(0);
    expect(t.total_amount).toBe(0);
  });

  it('rejects a negative discount rather than coercing it', () => {
    expect(() => computeBillTotals([gst5(500)], -50, true, 'pre-tax')).toThrow(
      /discount cannot be negative/i,
    );
  });

  it('handles an empty order without dividing by zero', () => {
    const t = computeBillTotals([], 0, true, 'pre-tax');
    expect(t.total_amount).toBe(0);
    expect(t.lines).toEqual([]);
  });
});
