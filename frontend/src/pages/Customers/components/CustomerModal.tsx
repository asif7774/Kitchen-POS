import React, { useState } from 'react';
import { Customer } from '../../../types/models';
import { api } from '../../../lib/ipc';
import { Input } from '../../../components/atoms';

interface Props {
  customer?: Customer | null;
  onSuccess: () => void;
}

const CustomerModal: React.FC<Props> = ({ customer, onSuccess }) => {
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [creditLimit, setCreditLimit] = useState(customer?.credit_limit.toString() ?? '0');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Name is required');
      return;
    }
    setError('');

    const payload = {
      name,
      phone: phone || undefined,
      email: email || undefined,
      credit_limit: parseFloat(creditLimit) || 0
    };

    let res;
    if (customer) {
      res = await api.customers.update({ ...payload, id: customer.id });
    } else {
      res = await api.customers.create(payload);
    }

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error ?? 'Failed to save customer');
    }
  };

  return (
    <form id="customer-form" onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <Input 
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          placeholder="e.g. John Doe"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <Input 
          value={phone}
          onChange={(e) => { setPhone(e.target.value); }}
          placeholder="e.g. +91 9876543210"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input 
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); }}
          placeholder="e.g. john@example.com"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
        <Input 
          type="number"
          min="0"
          step="0.01"
          value={creditLimit}
          onChange={(e) => { setCreditLimit(e.target.value); }}
          placeholder="e.g. 5000"
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">Maximum allowed unpaid balance for this customer.</p>
      </div>

    </form>
  );
};

export default CustomerModal;
