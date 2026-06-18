import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/ipc';
import { Input, Button, BackButton } from '../../components/atoms';
import { useToast } from '../../hooks/useToast';

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      void api.customers.getById(Number(id)).then(res => {
        if (res.success && res.data) {
          const c = res.data;
          setName(c.name);
          setPhone(c.phone ?? '');
          setEmail(c.email ?? '');
          setCreditLimit(c.credit_limit.toString());
        } else {
          showToast({ message: 'Customer not found', variant: 'error' });
          navigate('/customers');
        }
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [id, isNew, navigate, showToast]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    setSaving(true);

    const payload = {
      name,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      credit_limit: parseFloat(creditLimit) || 0
    };

    let res;
    if (isNew) {
      res = await api.customers.create(payload);
    } else {
      res = await api.customers.update({ ...payload, id: Number(id) });
    }

    setSaving(false);

    if (res.success) {
      showToast({ message: `Customer ${isNew ? 'created' : 'updated'} successfully`, variant: 'success' });
      navigate('/customers');
    } else {
      setError(res.error ?? 'Failed to save customer');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse bg-white p-6 rounded-lg shadow-sm border h-64"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center">
        <BackButton to="/customers" label="Back to Customers" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="border-b px-6 py-4 bg-gray-50">
          <h1 className="text-xl font-bold text-gray-800">
            {isNew ? 'Add New Customer' : 'Edit Customer'}
          </h1>
        </div>

        <div className="p-6">
          <form id="customer-form" onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}
            
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

            <div className="pt-4 flex gap-3 justify-end border-t mt-6">
              <Button type="button" variant="outline" onClick={() => { navigate('/customers'); }}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={saving}>
                Save Customer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
