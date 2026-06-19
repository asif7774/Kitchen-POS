import { Button, Input, Select } from '../../../components/atoms';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { api } from '../../../lib/ipc';
import { CartItem, Customer } from '../../../types/models';
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

const BillModal = forwardRef<BillModalHandle, Props>(({ orderId, cart, initialCustomer, onClose }, ref) => {
  const { showToast } = useToast();

  const taxableTotal = round2(cart.reduce((sum, item) => sum + item.price * item.qty, 0));
  const [discount, setDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer ?? null);
  const [payments, setPayments] = useState<{ method: string; amount: number }[]>([]);
  const [isGstEnabled, setIsGstEnabled] = useState(true);

  useEffect(() => {
    void api.settings.get().then(res => {
      if (res.success && res.data && typeof (res.data as Record<string, unknown>).is_gst_enabled === 'boolean') {
        setIsGstEnabled((res.data as Record<string, unknown>).is_gst_enabled as boolean);
      }
    });
  }, []);

  const totalAfterDiscount = round2(Math.max(0, taxableTotal - discount));
  const cgstTotal = isGstEnabled ? round2(totalAfterDiscount * 0.025) : 0;
  const sgstTotal = isGstEnabled ? round2(totalAfterDiscount * 0.025) : 0;
  const finalTotal = round2(totalAfterDiscount + cgstTotal + sgstTotal);

  useEffect(() => {
    setPayments([{ method: 'cash', amount: finalTotal }]);
  // Only reset payments when the final total changes due to cart/discount changes.
   
  }, [finalTotal]);

  const currentPaymentsTotal = round2(payments.reduce((sum, p) => sum + (p.amount || 0), 0));
  const isBalanced = Math.abs(currentPaymentsTotal - finalTotal) < 0.01;

  const handlePaymentChange = (index: number, field: string, value: string | number) => {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleConfirm = async (shouldPrint: boolean) => {
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
          const printRes = await api.print.bill({ bill: res.data, orderItems: mappedItems, settings: {} });
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
        <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Itemised Breakdown</h3>
        <div className="space-y-3 mb-6">
          {cart.map(item => {
            const base = round2(item.price * item.qty);
            const c = isGstEnabled ? round2(base * 0.025) : 0;
            const s = isGstEnabled ? round2(base * 0.025) : 0;
            return (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name} x {item.qty}</p>
                  {isGstEnabled && <p className="text-xs text-gray-500">CGST: ₹{c.toFixed(2)} | SGST: ₹{s.toFixed(2)}</p>}
                </div>
                <p className="font-medium">₹{round2(base + c + s).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Taxable Amount</span>
            <span>₹{taxableTotal.toFixed(2)}</span>
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
          {isGstEnabled && (
            <>
              <div className="flex justify-between text-gray-600">
                <span>CGST (2.5%)</span>
                <span>₹{cgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (2.5%)</span>
                <span>₹{sgstTotal.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
            <span>Grand Total</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Right Side - Payment Split */}
      <div className="w-full md:w-64 bg-gray-50 p-4 rounded border flex flex-col h-[calc(100vh-12rem)] overflow-y-auto">
        <div className="mb-6 relative">
          <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">Customer</h3>
          <CustomerSelect selectedCustomer={selectedCustomer} onSelect={setSelectedCustomer} />
        </div>

        <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Payments</h3>
        <div className="space-y-3">
          {payments.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 relative border p-2 rounded bg-white">
              {payments.length > 1 && (
                <Button size="icon" variant="ghost" onClick={() => { setPayments(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-1 right-1 text-red-500 h-6 w-6">✕</Button>
              )}
              <div className="flex gap-2">
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
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() => { setPayments(prev => [...prev, { method: 'card', amount: 0 }]); }}
            className="w-full py-2 border-dashed border-2 bg-transparent text-blue-600 hover:bg-blue-50"
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
