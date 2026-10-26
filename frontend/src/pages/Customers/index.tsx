import React, { useState, useEffect } from 'react';
import { Customer } from '../../types/models';
import { api } from '../../lib/ipc';
import { Button, Autosearch } from '../../components/atoms';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import SettleBalanceModal from './components/SettleBalanceModal';
import { useHeader } from '../../contexts/HeaderContext';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/molecules/Table';

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
    const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_balance, 0);
    const subtitle = `${customers.length} Customers Total • Total Outstanding: ₹${Math.round(totalOutstanding)}`;

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
      </div>,
      subtitle
    );
    return () => { setHeader(null, null, null); };
  }, [setHeader, handleCreate, searchQuery, searchOptions, customers]);

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
    navigate(`/customers/${customer.id}/history`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (c.phone?.includes(searchQuery) ?? false)
  );

  return (
    <>
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Total Spend</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="text-sm font-medium text-gray-900">{c.name}</div>
                  <div className="text-sm text-gray-500">{c.email ?? 'No email'}</div>
                </TableCell>
                <TableCell className="text-gray-500">{c.phone ?? '-'}</TableCell>
                <TableCell className="text-gray-900 text-right">₹{Math.round(c.credit_limit)}</TableCell>
                <TableCell className="text-right">
                  <span className={c.outstanding_balance > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                    ₹{Math.round(c.outstanding_balance)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-gray-900">
                  ₹{Math.round(c.total_spend ?? 0)}
                </TableCell>
                <TableCell className="text-right font-medium space-x-2">
                  <Button variant="outline" onClick={() => { handleViewHistory(c); }}>History</Button>
                  {c.outstanding_balance > 0 && (
                    <Button variant="outline" onClick={() => { handleSettleBalance(c); }}>Settle</Button>
                  )}
                  <Button variant="outline" onClick={() => { handleEdit(c); }}>Edit</Button>
                  <Button variant="danger" onClick={() => { handleDelete(c.id); }}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                  No customers found. Click "Add Customer" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default CustomersPage;
