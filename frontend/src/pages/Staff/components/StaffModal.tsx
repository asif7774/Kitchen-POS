import React, { useState } from 'react';
import Input from '../../../components/atoms/input/input';
import Select from '../../../components/atoms/select/select';
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
      
      <Select 
        label="Role"
        value={role}
        onChange={e => { setRole(e.target.value); }}
        required
      >
        {ROLES.map(r => (
          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
        ))}
      </Select>
      
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
