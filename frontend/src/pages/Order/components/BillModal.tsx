import { Button, Input, Select } from '../../../components/atoms';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { api } from '../../../lib/ipc';
import { BillTotals, CartItem, Customer } from '../../../types/models';
import { useToast } from '../../../hooks/useToast';
import { CustomerSelect } from '../../../components/organisms/CustomerSelect';

interface Props {
  orderId: number;
  cart: CartItem[];
  initialCustomer?: Customer | null;
  onClose: () => void;
}

export interface BillModalHandle {
  save: () => void;
  print: () => void;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const PREVIEW_DEBOUNCE_MS = 275;

const BillModal = forwardRef<BillModalHandle, Props>(({ orderId, cart, initialCustomer, onClose }, ref) => {
  const { showToast } = useToast();

  // Cart subtotal, shown as a line-item sum only. It must never feed a tax or
  // grand-total figure — those come from the main process.
  const taxableTotal = round2(cart.reduce((sum, item) => sum + item.price * item.qty, 0));
  const [discount, setDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer ?? null);
  const [payments, setPayments] = useState<{ method: string; amount: number }[]>([]);
  const [paymentsTouched, setPaymentsTouched] = useState(false);

  const [settings, setSettings] = useState<Record<string, unknown>>({});

  // Authoritative figures. Null until the first preview returns, which is why
  // confirmation is blocked below until it does.
  const [totals, setTotals] = useState<BillTotals | null>(null);
  const [previewing, setPreviewing] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    void api.settings.get().then(res => {
      if (res.success && res.data) {
        setSettings(res.data as Record<string, unknown>);
      }
    });
  }, []);

  // Ask the main process what the bill comes to. Debounced so typing in the
  // discount field stays responsive, and re-run whenever the cart changes.
  useEffect(() => {
    setPreviewing(true);
    const timer = setTimeout(() => {
      void api.billing.preview({ orderId, discount }).then(res => {
        if (res.success && res.data) {
          setTotals(res.data);
          setPreviewError(null);
        } else {
          setTotals(null);
          setPreviewError(res.error ?? 'Could not calculate the bill.');
        }
        setPreviewing(false);
      });
    }, PREVIEW_DEBOUNCE_MS);
    return () => { clearTimeout(timer); };
  }, [orderId, discount, cart]);

  const cgstTotal = totals?.cgst_amount ?? 0;
  const sgstTotal = totals?.sgst_amount ?? 0;
  const finalTotal = totals?.total_amount ?? 0;

  // Pre-fill a single cash row at the previewed total, but never overwrite a
  // split the operator has started entering — a debounced preview landing
  // mid-edit would otherwise wipe it.
  useEffect(() => {
    if (!totals || paymentsTouched) {
      return;
    }
    setPayments([{ method: 'cash', amount: totals.total_amount }]);
  }, [totals, paymentsTouched]);

  const currentPaymentsTotal = round2(payments.reduce((sum, p) => sum + (p.amount || 0), 0));
  // Payments can only balance against figures that actually arrived. Confirmation
  // is additionally gated on the preview being settled — see handleConfirm.
  const isBalanced = !!totals && Math.abs(currentPaymentsTotal - finalTotal) < 0.01;

  const lineById = new Map(totals?.lines.map(l => [l.order_item_id, l]) ?? []);

  const handlePaymentChange = (index: number, field: string, value: string | number) => {
    setPaymentsTouched(true);
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleConfirm = async (shouldPrint: boolean) => {
    if (previewing || !totals) {
      showToast({ message: 'Still calculating the bill — one moment', variant: 'warning' });
      return;
    }
    if (previewError) {
      showToast({ message: previewError, variant: 'error' });
      return;
    }
    if (!isBalanced) {
      showToast({ message: 'Payments must balance the grand total', variant: 'warning' });
      return;
    }
    const unpaidAmount = payments.filter(p => p.method === 'unpaid').reduce((sum, p) => sum + p.amount, 0);
    if (unpaidAmount > 0) {
      if (!selectedCustomer) {
        showToast({ message: 'Please select a customer for unpaid balance', variant: 'warning' });
        return;
      }
      if (selectedCustomer.outstanding_balance + unpaidAmount > selectedCustomer.credit_limit) {
        showToast({ message: 'Credit limit exceeded for this customer', variant: 'error' });
        return;
      }
    }

    try {
      const res = await api.billing.createBill({ orderId, payments, discount, customerId: selectedCustomer?.id });
      if (res.success) {
        if (shouldPrint) {
          const mappedItems = cart.map(i => ({ name: i.name, qty: i.qty, unit_price: i.price }));
          const printRes = await api.print.bill({ bill: res.data, orderItems: mappedItems, settings });
          if (!printRes.success) {
            showToast({ message: `Failed to print bill: ${printRes.error}`, variant: 'error' });
          }
        }
        showToast({ message: 'Bill generated successfully', variant: 'success' });
        onClose();
      } else {
        showToast({ message: res.error ?? 'Failed to generate bill', variant: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'An unexpected error occurred', variant: 'error' });
    }
  };

  useImperativeHandle(ref, () => ({
    save: () => { void handleConfirm(false); },
    print: () => { void handleConfirm(true); },
  }));

  return (
    <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-8">
      {/* Left Side - Itemized Breakdown */}
      <div className="flex-1">
        {typeof settings.outlet_name === 'string' && settings.outlet_name && (
          <h2 className="text-xl font-bold text-gray-800 text-center mb-4">{settings.outlet_name}</h2>
        )}
        <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Itemised Breakdown</h3>
        <div className="space-y-3 mb-6">
          {cart.map(item => {
            // Tax per line comes from the preview, never computed here. If a
            // line cannot be matched, its tax is omitted rather than guessed —
            // showing an invented figure is worse than showing none.
            const line = lineById.get(item.id);
            const base = round2(item.price * item.qty);
            return (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name} x {item.qty}</p>
                  {line && (line.cgst_amount > 0 || line.sgst_amount > 0) && (
                    <p className="text-xs text-gray-500 tabular">
                      CGST: ₹{line.cgst_amount.toFixed(2)} | SGST: ₹{line.sgst_amount.toFixed(2)}
                    </p>
                  )}
                </div>
                <p className="font-medium tabular">₹{(line?.total_amount ?? base).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular">₹{taxableTotal.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-1 my-1">
            <div className="flex justify-between items-center mt-2">
              <span className="w-1/3">Discount</span>
              <div className="w-24">
                <Input
                  type="number"
                  className="text-right"
                  value={discount}
                  onChange={e => { setDiscount(Number(e.target.value) || 0); }}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 mt-1">
              {[5, 10, 15, 20, 25, 30].map(pct => (
                <Button
                  key={pct}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setDiscount(round2(taxableTotal * (pct / 100))); }}
                  className="!rounded-full !px-2 !py-0.5 !text-xs"
                >
                  {pct}%
                </Button>
              ))}
            </div>
          </div>
          {totals && totals.discount_amount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Taxable Amount</span>
              <span className="tabular">₹{totals.taxable_amount.toFixed(2)}</span>
            </div>
          )}
          {/* No rate in the label: a bill can mix rates, so one number here
              would be wrong as soon as it did. */}
          {(cgstTotal > 0 || sgstTotal > 0) && (
            <>
              <div className="flex justify-between text-gray-600">
                <span>CGST</span>
                <span className="tabular">₹{cgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST</span>
                <span className="tabular">₹{sgstTotal.toFixed(2)}</span>
              </div>
            </>
          )}
          {previewError && (
            <p className="text-sm text-red-600 pt-2">{previewError}</p>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
            <span>Grand Total</span>
            <span className="tabular">
              {previewing || !totals ? '…' : `₹${finalTotal.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side - Payment Split */}
      <div className="w-full md:w-96 bg-gray-50 p-4 rounded border flex flex-col h-[calc(100vh-12rem)] overflow-y-auto">
        <div className="mb-6 relative">
          <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">Customer</h3>
          <CustomerSelect selectedCustomer={selectedCustomer} onSelect={setSelectedCustomer} />
        </div>

        <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Payments</h3>
        <div className="space-y-3">
          {payments.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 border p-2 rounded bg-white">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Select value={p.method} onChange={(e) => { handlePaymentChange(i, 'method', e.target.value); }}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="complimentary">Complimentary</option>
                    <option value="unpaid">Unpaid Balance</option>
                  </Select>
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={p.amount === 0 && payments.length === 1 ? '' : p.amount}
                    onChange={(e) => { handlePaymentChange(i, 'amount', Number(e.target.value)); }}
                    min={p.method === 'unpaid' ? undefined : '0'}
                    step="0.01"
                  />
                  {p.method === 'unpaid' && (
                    <p className="text-[10px] text-gray-500 mt-1 leading-tight">Use a negative number to log an advance/change due.</p>
                  )}
                </div>
                {payments.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => { setPayments(prev => prev.filter((_, idx) => idx !== i)); }} className="text-red-500 h-10 w-8 shrink-0">✕</Button>
                )}
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() => { setPayments(prev => [...prev, { method: 'card', amount: 0 }]); }}
            className="w-full py-2 border-dashed border-2 bg-transparent text-emerald-500 hover:bg-emerald-50"
          >
            + Split Payment
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between text-sm mb-1">
            <span>Tendered:</span>
            <span className={`font-bold ${!isBalanced ? 'text-red-600' : 'text-green-600'}`}>
              ₹{currentPaymentsTotal.toFixed(2)}
            </span>
          </div>
          {!isBalanced && (
            <p className="text-xs text-red-500 text-right">
              Balance due: ₹{round2(finalTotal - currentPaymentsTotal).toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

BillModal.displayName = 'BillModal';

export default BillModal;
