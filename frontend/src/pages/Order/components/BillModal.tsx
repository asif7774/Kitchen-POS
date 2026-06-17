import React, { useState } from 'react';
import { api } from '../../../lib/ipc';
import { CartItem } from '../../../types/models';
import Button from '../../../components/atoms/button/button';

interface Props {
  orderId: number;
  cart: CartItem[];
  onClose: () => void;
}

const BillModal: React.FC<Props> = ({ orderId, cart, onClose }) => {
  const initialTaxable = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const initialTotal = initialTaxable + (initialTaxable * 0.05);

  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState<{method: string, amount: number}[]>([{ method: 'cash', amount: initialTotal }]);

  // Calculations
  const taxableTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalAfterDiscount = Math.max(0, taxableTotal - discount);
  const cgstTotal = totalAfterDiscount * 0.025; // 2.5%
  const sgstTotal = totalAfterDiscount * 0.025; // 2.5%
  const finalTotal = totalAfterDiscount + cgstTotal + sgstTotal;

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
    if (!isBalanced) {return;}
    try {
      const res = await api.billing.createBill({
         orderId,
         payments,
         discount
      });
      if (res.success) {
         await api.print.bill({ bill: res.data, orderItems: cart, settings: {} });
         // Alert removed for lint compliance
         onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
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
            <div className="flex justify-between items-center">
              <span>Discount</span>
              <input 
                type="number" 
                className="border rounded p-1 w-24 text-right"
                value={discount}
                onChange={e => { setDiscount(Number(e.target.value) || 0); }}
                min="0"
              />
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
                <select 
                  className="border rounded p-1.5 text-sm"
                  value={p.method}
                  onChange={(e) => { handlePaymentChange(i, 'method', e.target.value); }}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="complimentary">Complimentary</option>
                </select>
                <input 
                  type="number" 
                  className="border rounded p-1.5 text-sm"
                  placeholder="Amount"
                  value={p.amount === 0 && payments.length === 1 ? '' : p.amount}
                  onChange={(e) => { handlePaymentChange(i, 'amount', Number(e.target.value)); }}
                  min="0"
                  step="0.01"
                />
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

      <div className="-mx-6 -mb-4 px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-4">
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button 
          variant="primary"
          onClick={() => { void handleConfirm(); }} 
          disabled={!isBalanced || finalTotal === 0}
        >
          Confirm & Print
        </Button>
      </div>
    </>
  );
};

export default BillModal;
