/**
 * The single source of bill arithmetic.
 *
 * Every figure the operator sees, the customer is charged, and the bills table
 * stores comes from computeBillTotals. Nothing else in the application may
 * compute tax or a bill total — the defect this replaces was two
 * implementations drifting apart, which produced a receipt that disagreed with
 * both the screen and the amount collected.
 */

export type DiscountApplication = 'pre-tax' | 'post-tax';

/**
 * Whether a bill-level discount reduces the taxable base or comes off after tax.
 *
 * PROVISIONAL. This is an engineering default, not a confirmed GST position —
 * see D3 in docs/superpowers/specs/2026-10-26-authoritative-bill-pricing-design.md.
 * Confirm with whoever signs off the GST returns before relying on it.
 *
 * Both values are covered by tests, so changing this constant is safe: the suite
 * states exactly what each ordering yields.
 */
export const DISCOUNT_APPLICATION: DiscountApplication = 'pre-tax';

export interface OrderItemInput {
  id?: number;
  unit_price: number;
  qty: number;
  cgst_rate: number;
  sgst_rate: number;
  /** Per-item discount, applied before any bill-level discount. */
  discount?: number;
}

export interface BillLine {
  order_item_id: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
}

export interface BillTotals {
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  discount_amount: number;
  total_amount: number;
  lines: BillLine[];
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Splits a bill-level discount across lines in proportion to their value.
 *
 * A discount on the whole bill reduces every supply in it proportionally, so
 * each tax rate's base shrinks by the same percentage. Consuming the discount
 * against lines in some arbitrary order, or applying one blended rate, would
 * produce a CGST/SGST split that does not correspond to the goods sold — and
 * that split is what gets filed.
 *
 * Shares are computed unrounded, then rounded per line. Any residual paise go
 * to the largest line by value (ties broken by lowest id) so the allocation
 * always sums to exactly the discount entered.
 */
function allocateProRata(lineValues: number[], ids: number[], discount: number): number[] {
  const subtotal = lineValues.reduce((a, b) => a + b, 0);
  if (subtotal <= 0 || discount <= 0) {
    return lineValues.map(() => 0);
  }

  const shares = lineValues.map((v) => round2((v / subtotal) * discount));
  const residual = round2(discount - shares.reduce((a, b) => a + b, 0));

  if (residual !== 0) {
    let target = 0;
    for (let i = 1; i < lineValues.length; i++) {
      const bigger = lineValues[i] > lineValues[target];
      const tiedButLowerId = lineValues[i] === lineValues[target] && ids[i] < ids[target];
      if (bigger || tiedButLowerId) {
        target = i;
      }
    }
    shares[target] = round2(shares[target] + residual);
  }

  return shares;
}

export function computeBillTotals(
  items: OrderItemInput[],
  billDiscount: number,
  isGstEnabled: boolean,
  mode: DiscountApplication = DISCOUNT_APPLICATION,
): BillTotals {
  if (billDiscount < 0) {
    throw new Error('Discount cannot be negative.');
  }

  const ids = items.map((it, i) => it.id ?? i);
  const lineValues = items.map((it) => round2(it.unit_price * it.qty - (it.discount ?? 0)));
  const subtotal = round2(lineValues.reduce((a, b) => a + b, 0));

  // A discount larger than the bill is clamped rather than producing a negative
  // total. A full comp is legitimate — the complimentary payment method exists.
  const discount = round2(Math.min(billDiscount, Math.max(subtotal, 0)));

  const shares =
    mode === 'pre-tax'
      ? allocateProRata(lineValues, ids, discount)
      : lineValues.map(() => 0);

  const lines: BillLine[] = items.map((it, i) => {
    const taxable = round2(Math.max(lineValues[i] - shares[i], 0));
    const cgst = isGstEnabled ? round2(taxable * (it.cgst_rate / 100)) : 0;
    const sgst = isGstEnabled ? round2(taxable * (it.sgst_rate / 100)) : 0;
    return {
      order_item_id: ids[i],
      taxable_amount: taxable,
      cgst_amount: cgst,
      sgst_amount: sgst,
      total_amount: round2(taxable + cgst + sgst),
    };
  });

  const sum = (pick: (l: BillLine) => number) => round2(lines.reduce((a, l) => a + pick(l), 0));

  const taxable_amount = sum((l) => l.taxable_amount);
  const cgst_amount = sum((l) => l.cgst_amount);
  const sgst_amount = sum((l) => l.sgst_amount);
  const gross = sum((l) => l.total_amount);

  // Under post-tax the discount was not allocated to the lines, so it comes off
  // the gross here. Under pre-tax it is already reflected in every line.
  const total_amount = round2(mode === 'post-tax' ? Math.max(gross - discount, 0) : gross);

  return {
    taxable_amount,
    cgst_amount,
    sgst_amount,
    discount_amount: discount,
    total_amount,
    lines,
  };
}
