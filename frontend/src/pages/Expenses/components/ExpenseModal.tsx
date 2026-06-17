import React, { useState, useEffect } from 'react';
import Input from '../../../components/atoms/input/input';
import Select from '../../../components/atoms/select/select';

interface ExpenseModalProps {
  onClose: () => void;
  onSave: (data: { date: string, category: string, amount: number, description: string, staff_id?: number }) => void;
}

import { Staff } from '../../../types/models';
import { api } from '../../../lib/ipc';

const CATEGORIES = ['Ingredients', 'Utilities', 'Salary', 'Maintenance', 'Miscellaneous'];

const ExpenseModal: React.FC<Omit<ExpenseModalProps, 'onClose'>> = ({ onSave }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [staffId, setStaffId] = useState<number | ''>('');
  const [staffList, setStaffList] = useState<Staff[]>([]);

  useEffect(() => {
    void api.staff.getAll().then(res => {
      if (res.success && res.data) {
        setStaffList(res.data.filter(s => s.is_active));
      }
    });
  }, []);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }
    const dataToSave: { date: string, category: string, amount: number, description: string, staff_id?: number } = { 
      date, 
      category, 
      amount: numAmount, 
      description 
    };
    if (staffId !== '') {
      dataToSave.staff_id = staffId;
    }
    onSave(dataToSave);
  };

  return (
    <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
      <Input 
        label="Date"
        type="date"
        value={date}
        onChange={e => { setDate(e.target.value); }}
        required
      />
      
      <Select 
        label="Category"
        value={category}
        onChange={e => { 
          setCategory(e.target.value); 
          if (e.target.value !== 'Salary') {setStaffId('');}
        }}
        required
      >
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Select>

      {category === 'Salary' && (
        <Select 
          label="Link to Staff (Optional)"
          value={staffId}
          onChange={e => { setStaffId(e.target.value ? Number(e.target.value) : ''); }}
        >
          <option value="">-- No Staff Linked --</option>
          {staffList.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
          ))}
        </Select>
      )}
      
      <Input 
        label="Amount (₹)"
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={e => { setAmount(e.target.value); }}
        placeholder="e.g. 500.00"
        required
      />
      
      <Input 
        label="Description (Optional)"
        value={description}
        onChange={e => { setDescription(e.target.value); }}
        placeholder="e.g. Purchased tomatoes and onions"
      />
    </form>
  );
};

export default ExpenseModal;
