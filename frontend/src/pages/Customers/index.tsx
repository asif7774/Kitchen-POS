import React, { useState, useEffect } from 'react';
import { Customer } from '../../types/models';
import { api } from '../../lib/ipc';
import { Button, Autosearch } from '../../components/atoms';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import SettleBalanceModal from './components/SettleBalanceModal';
import CustomerHistoryModal from './components/CustomerHistoryModal';
import { useHeader } from '../../contexts/HeaderContext';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadCustomers = async () => {
    const res = await api.customers.getAll();
    if (res.success && res.data) {
      setCustomers(res.data);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { void loadCustomers(); }, 0);
    return () => { clearTimeout(timer); };
  }, []);

  const handleCreate = React.useCallback(() => {
    navigate('/customers/new');
  }, [navigate]);

  const searchOptions = React.useMemo(() => customers.map(c => ({
    value: String(c.id),
    label: c.name
  })), [customers]);

  const { setHeader } = useHeader();
  useEffect(() => {
    setHeader(
      'Customers', 
      <div className="flex items-center space-x-4">
        <div className="w-64">
          <Autosearch
            placeholder="Search customers by name..."
            options={searchOptions}
            value={searchQuery}
            onChange={setSearchQuery}
            onSelectOption={(opt) => { setSearchQuery(opt.label); }}
          />
        </div>
        <Button onClick={handleCreate} variant="primary">Add Customer</Button>
      </div>
    );
    return () => { setHeader(null, null); };
  }, [setHeader, handleCreate, searchQuery, searchOptions]);

  const handleEdit = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleDelete = (id: number) => {
    showModal({
      title: 'Confirm Delete',
      content: <p className="text-gray-700">Are you sure you want to delete this customer?</p>,
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            void api.customers.delete(id).then(res => {
              if (res.success) {
                void loadCustomers();
                hideModal();
              } else {
                showToast({ message: `Failed to delete customer: ${res.error}`, variant: 'error' });
              }
            });
          }}>Delete</Button>
        </>
      )
    });
  };

  const handleSettleBalance = (customer: Customer) => {
    showModal({
      title: `Settle Balance: ${customer.name}`,
      content: <SettleBalanceModal 
        customer={customer} 
        onSuccess={() => { hideModal(); void loadCustomers(); }} 
      />,
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button type="submit" form="settle-balance-form" variant="primary">Settle Balance</Button>
        </>
      )
    });
  };

  const handleViewHistory = (customer: Customer) => {
    showModal({
      title: 'Order History',
      content: <CustomerHistoryModal customer={customer} />,
      actions: (
        <Button variant="outline" onClick={hideModal}>Close</Button>
      )
    });
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (c.phone?.includes(searchQuery) ?? false)
  );

  return (
    <>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Phone</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Credit Limit</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Outstanding</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-gray-800">{c.name}</div>
                  <div className="text-sm text-gray-500">{c.email ?? 'No email'}</div>
                </td>
                <td className="p-4">{c.phone ?? '-'}</td>
                <td className="p-4 text-right">₹{c.credit_limit.toFixed(2)}</td>
                <td className="p-4 text-right">
                  <span className={c.outstanding_balance > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                    ₹{c.outstanding_balance.toFixed(2)}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <Button variant="outline" onClick={() => { handleViewHistory(c); }}>History</Button>
                  {c.outstanding_balance > 0 && (
                    <Button variant="outline" onClick={() => { handleSettleBalance(c); }}>Settle</Button>
                  )}
                  <Button variant="outline" onClick={() => { handleEdit(c); }}>Edit</Button>
                  <Button variant="danger" onClick={() => { handleDelete(c.id); }}>Delete</Button>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No customers found. Click "Add Customer" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
};

export default CustomersPage;
