import { Button, Input, Select } from '../../../components/atoms';
import React, { useState } from 'react';
import { api } from '../../../lib/ipc';
import { CartItem } from '../../../types/models';
import { useToast } from '../../../hooks/useToast';

interface Props {
  orderId: number;
  cart: CartItem[];
  onClose: () => void;
}

const BillModal: React.FC<Props> = ({ orderId, cart, onClose }) => {
  const initialTaxable = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const initialTotal = initialTaxable + (initialTaxable * 0.05);
  const { showToast } = useToast();

  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState<{method: string, amount: number}[]>([{ method: 'cash', amount: initialTotal }]);

  // Calculations
  const taxableTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalAfterDiscount = Math.max(0, taxableTotal - discount);
  const cgstTotal = totalAfterDiscount * 0.025; // 2.5%
  const sgstTotal = totalAfterDiscount * 0.025; // 2.5%
  const finalTotal = totalAfterDiscount + cgstTotal + sgstTotal;

  React.useEffect(() => {
    if (payments.length === 1) {
      setPayments([{ ...payments[0], amount: Number(finalTotal.toFixed(2)) }]);
    }
  }, [finalTotal]);

  const currentPaymentsTotal = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  // Allow a small epsilon for floating point issues
  const isBalanced = Math.abs(currentPaymentsTotal - finalTotal) < 0.01;


  const handlePaymentChange = (index: number, field: string, value: string | number) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  const handleAddPayment = () => {
    setPayments([...payments, { method: 'card', amount: 0 }]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
  };

  const handleConfirm = async () => {
    if (!isBalanced) {
      showToast({ message: 'Payments must balance the grand total', variant: 'warning' });
      return;
    }
    if (finalTotal === 0 && discount < taxableTotal) {
      showToast({ message: 'Invalid final total', variant: 'error' });
      return;
    }
    try {
      const res = await api.billing.createBill({
         orderId,
         payments,
         discount
      });
      if (res.success) {
         const mappedItems = cart.map(i => ({ name: i.name, qty: i.qty, unit_price: i.price }));
         const printRes = await api.print.bill({ bill: res.data, orderItems: mappedItems, settings: {} });
         if (!printRes.success) {
           alert('Failed to print bill: ' + printRes.error);
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

  return (
    <form id="bill-form" onSubmit={(e) => { e.preventDefault(); void handleConfirm(); }}>
      <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-8">
        {/* Left Side - Itemized Breakdown */}
        <div className="flex-1">
          <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Itemised Breakdown</h3>
          <div className="space-y-3 mb-6">
            {cart.map(item => {
              const base = item.price * item.qty;
              const c = base * 0.025;
              const s = base * 0.025;
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.name} x {item.qty}</p>
                    <p className="text-xs text-gray-500">CGST: ₹{c.toFixed(2)} | SGST: ₹{s.toFixed(2)}</p>
                  </div>
                  <p className="font-medium">₹{(base + c + s).toFixed(2)}</p>
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
                    onClick={() => { setDiscount(Math.round(taxableTotal * (pct / 100) * 100) / 100); }}
                    className="!rounded-full !px-2 !py-0.5 !text-xs"
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>CGST (2.5%)</span>
              <span>₹{cgstTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>SGST (2.5%)</span>
              <span>₹{sgstTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
              <span>Grand Total</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Side - Payment Split */}
        <div className="w-full md:w-64 bg-gray-50 p-4 rounded border">
          <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Payments</h3>
          <div className="space-y-3">
            {payments.map((p, i) => (
              <div key={i} className="flex flex-col gap-2 relative border p-2 rounded bg-white">
                {payments.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => { handleRemovePayment(i); }} className="absolute top-1 right-1 text-red-500 h-6 w-6">✕</Button>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select 
                      value={p.method}
                      onChange={(e) => { handlePaymentChange(i, 'method', e.target.value); }}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="complimentary">Complimentary</option>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input 
                      type="number" 
                      placeholder="Amount"
                      value={p.amount === 0 && payments.length === 1 ? '' : p.amount}
                      onChange={(e) => { handlePaymentChange(i, 'amount', Number(e.target.value)); }}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button 
              variant="secondary"
              onClick={handleAddPayment} 
              className="w-full py-2 border-dashed border-2 bg-transparent text-blue-600 hover:bg-blue-50"
            >
              + Split Payment
            </Button>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between text-sm mb-1">
              <span>Tendered:</span>
              <span className={`font-bold ${Math.abs(currentPaymentsTotal - finalTotal) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{currentPaymentsTotal.toFixed(2)}
              </span>
            </div>
            {Math.abs(currentPaymentsTotal - finalTotal) > 0.01 && (
              <p className="text-xs text-red-500 text-right">
                Balance due: ₹{(finalTotal - currentPaymentsTotal).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default BillModal;
