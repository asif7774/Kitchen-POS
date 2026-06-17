import React, { useState } from 'react';
import Input from '../../../components/atoms/input/input';
import { Staff } from '../../../types/models';

interface StaffModalProps {
  onClose: () => void;
  onSave: (data: Partial<Staff>) => void;
  initialData?: Staff | null;
}

const ROLES = ['admin', 'manager', 'cashier', 'waiter', 'chef', 'cleaner'];

const StaffModal: React.FC<Omit<StaffModalProps, 'onClose'>> = ({ onSave, initialData }) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState(initialData?.role ?? ROLES[3]);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}
    if (!initialData && !pin.trim()) {return;} // PIN is required for new staff

    const dataToSave: Partial<Staff> & { pin?: string } = {
      name: name.trim(),
      role
    };

    if (pin.trim()) {
      dataToSave.pin = pin.trim();
    }
    
    if (initialData) {
      dataToSave.id = initialData.id;
    }

    onSave(dataToSave);
  };

  return (
    <form id="staff-form" onSubmit={handleSubmit} className="space-y-4">
      <Input 
        label="Name"
        value={name}
        onChange={e => { setName(e.target.value); }}
        placeholder="e.g. John Doe"
        required
      />
      
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select 
          value={role}
          onChange={e => { setRole(e.target.value); }}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          required
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      </div>
      
      <Input 
        label={initialData ? "New PIN (Leave blank to keep current)" : "PIN (4 digits)"}
        type="password"
        value={pin}
        onChange={e => { setPin(e.target.value); }}
        placeholder="e.g. 1234"
        required={!initialData}
        maxLength={4}
      />
    </form>
  );
};

export default StaffModal;
