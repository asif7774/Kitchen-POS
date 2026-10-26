import React, { useState, useEffect } from 'react';
import { Customer } from '../../types/models';
import { api } from '../../lib/ipc';
import { Input, Button } from '../atoms';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';

interface CustomerSelectProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  placeholder?: string;
  className?: string;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({ 
  selectedCustomer, 
  onSelect, 
  placeholder = "Search by name or phone",
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();

  const handleCreateCustomer = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const creditLimit = formData.get('creditLimit') as string;
    
    if (!name.trim()) {
      showToast({ message: 'Name is required', variant: 'error' });
      return;
    }

    const payload = {
      name,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      credit_limit: parseFloat(creditLimit) || 0
    };

    const res = await api.customers.create(payload);
    if (res.success && res.data) {
      showToast({ message: 'Customer created successfully', variant: 'success' });
      hideModal();
      setSearchQuery('');
      setSearchResults([]);
      // fetch the newly created customer to select it
      const custRes = await api.customers.getById(res.data.id);
      if (custRes.success && custRes.data) {
        onSelect(custRes.data);
      }
    } else {
      showToast({ message: res.error ?? 'Failed to create customer', variant: 'error' });
    }
  };

  const openCreateModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    showModal({
      title: 'Add New Customer',
      content: (
        <form id="create-customer-form" onSubmit={(e) => { void handleCreateCustomer(e); }} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Input name="name" required placeholder="e.g. John Doe" autoFocus className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <Input name="phone" placeholder="e.g. +91 9876543210" className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input type="email" name="email" placeholder="e.g. john@example.com" className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
            <Input 
              type="number"
              name="creditLimit"
              min="0"
              step="0.01"
              defaultValue="0"
              placeholder="e.g. 5000"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum allowed unpaid balance for this customer.</p>
          </div>
        </form>
      ),
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button type="submit" form="create-customer-form" variant="primary">Create</Button>
        </>
      )
    });
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        void api.customers.search(searchQuery).then(res => {
          if (res.success && res.data) {
            setSearchResults(res.data);
          } else {
            setSearchResults([]);
          }
          setIsSearching(false);
        });
      }, 300);
      return () => { clearTimeout(timer); };
    } 
    const timer2 = setTimeout(() => { 
      setSearchResults([]); 
      setIsSearching(false);
    }, 0);
    return () => { clearTimeout(timer2); };
  }, [searchQuery]);

  if (selectedCustomer) {
    return (
      <div className={`bg-white border rounded p-2 text-sm flex justify-between items-center ${className}`}>
        <div>
          <p className="font-bold">{selectedCustomer.name}</p>
          <p className="text-xs text-gray-500">Limit: ₹{selectedCustomer.credit_limit}</p>
        </div>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => { onSelect(null); }} 
          className="h-6 w-6"
          type="button"
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Input 
        placeholder={placeholder} 
        value={searchQuery}
        onChange={e => { 
          setSearchQuery(e.target.value); 
          if (e.target.value.length > 2) {
            setIsSearching(true);
          }
        }}
        className="w-full text-sm"
      />
      {searchQuery.length > 2 && isSearching && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg p-3 text-sm text-gray-500 flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Searching...
        </div>
      )}

      {(searchResults.length > 0 || (searchQuery.length > 2 && !isSearching)) && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-64 overflow-y-auto flex flex-col">
          {searchResults.map(c => (
            <div 
              key={c.id} 
              className="p-2 border-b hover:bg-emerald-50 cursor-pointer text-sm"
              onClick={() => { 
                onSelect(c); 
                setSearchQuery(''); 
                setSearchResults([]); 
              }}
            >
              <p className="font-bold">{c.name}</p>
              <p className="text-xs text-gray-500">{c.phone ?? 'No phone'}</p>
            </div>
          ))}

          {searchQuery.length > 2 && !isSearching && searchResults.length === 0 && (
            <div className="p-3 text-sm text-gray-500 text-center border-b">
              No Customer found
            </div>
          )}

          <div 
            className="p-2 text-center text-emerald-500 font-bold hover:bg-emerald-50 cursor-pointer text-sm sticky bottom-0 bg-white border-t"
            onClick={openCreateModal}
          >
            + Add New Customer
          </div>
        </div>
      )}
    </div>
  );
};
