import React, { useState } from 'react';
import { Customer } from '../../../types/models';
import { api } from '../../../lib/ipc';
import { Button, Input } from '../../../components/atoms';

interface Props {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

const SettleBalanceModal: React.FC<Props> = ({ customer, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(customer.outstanding_balance.toString());
  const [method, setMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const settleAmt = parseFloat(amount);
    
    if (isNaN(settleAmt) || settleAmt <= 0) {
      setError('Enter a valid amount greater than 0');
      return;
    }
    
    if (settleAmt > customer.outstanding_balance) {
      setError('Cannot settle more than the outstanding balance');
      return;
    }

    setLoading(true);
    setError('');

    const res = await api.customers.settleBalance({ 
      customerId: customer.id, 
      amount: settleAmt, 
      method 
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error ?? 'Failed to settle balance');
    }
  };

  return (
    <form id="settle-balance-form" onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
        <p className="text-sm text-blue-800">
          Current Outstanding Balance: <strong className="text-lg text-red-600">₹{customer.outstanding_balance.toFixed(2)}</strong>
        </p>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Settle (₹)</label>
        <Input 
          type="number"
          min="0.01"
          step="0.01"
          max={customer.outstanding_balance.toString()}
          autoFocus
          value={amount}
          onChange={(e) => { setAmount(e.target.value); }}
          className="w-full text-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
        <div className="flex gap-2">
          {(['cash', 'card', 'upi'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMethod(m); }}
              className={`flex-1 py-2 px-4 rounded border capitalize font-medium transition-colors ${
                method === m 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

    </form>
  );
};

export default SettleBalanceModal;
