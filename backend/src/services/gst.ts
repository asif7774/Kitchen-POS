export interface OrderItem {
  id?: number;
  unit_price: number;
  qty: number;
  cgst_rate: number;
  sgst_rate: number;
  discount?: number;
}

function roundTo2DP(num: number): number {
  return Math.round(num * 100) / 100;
}

export function calcLineItemTax(unitPrice: number, qty: number, cgstRate: number, sgstRate: number, discount: number = 0) {
  const baseAmount = unitPrice * qty;
  const taxableAmount = baseAmount - discount;
  const cgstAmount = taxableAmount * (cgstRate / 100);
  const sgstAmount = taxableAmount * (sgstRate / 100);
  const totalAmount = taxableAmount + cgstAmount + sgstAmount;

  return {
    taxableAmount: roundTo2DP(taxableAmount),
    cgstAmount: roundTo2DP(cgstAmount),
    sgstAmount: roundTo2DP(sgstAmount),
    totalAmount: roundTo2DP(totalAmount)
  };
}

export function calcBillTotals(items: OrderItem[]) {
  let taxable_amount = 0;
  let cgst_amount = 0;
  let sgst_amount = 0;
  let discount_amount = 0;
  let total_amount = 0;

  for (const item of items) {
    const tax = calcLineItemTax(item.unit_price, item.qty, item.cgst_rate, item.sgst_rate, item.discount ?? 0);
    taxable_amount += tax.taxableAmount;
    cgst_amount += tax.cgstAmount;
    sgst_amount += tax.sgstAmount;
    discount_amount += (item.discount ?? 0);
    total_amount += tax.totalAmount;
  }

  return {
    taxable_amount: roundTo2DP(taxable_amount),
    cgst_amount: roundTo2DP(cgst_amount),
    sgst_amount: roundTo2DP(sgst_amount),
    discount_amount: roundTo2DP(discount_amount),
    total_amount: roundTo2DP(total_amount)
  };
}
