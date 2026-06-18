import React, { useState, useEffect } from 'react';
import { Customer } from '../../types/models';
import { api } from '../../lib/ipc';
import { Input, Button } from '../atoms';

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

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        void api.customers.search(searchQuery).then(res => {
          if (res.success && res.data) {
            setSearchResults(res.data);
          }
        });
      }, 300);
      return () => { clearTimeout(timer); };
    } 
    const timer2 = setTimeout(() => { setSearchResults([]); }, 0);
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
        onChange={e => { setSearchQuery(e.target.value); }}
        className="w-full text-sm"
      />
      {searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
          {searchResults.map(c => (
            <div 
              key={c.id} 
              className="p-2 border-b last:border-b-0 hover:bg-blue-50 cursor-pointer text-sm"
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
        </div>
      )}
    </div>
  );
};
