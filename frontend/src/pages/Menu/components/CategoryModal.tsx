import React, { useState } from 'react';
import { Category } from '../../../types/models';
import Button from '../../../components/atoms/button/button';
import { api } from '../../../lib/ipc';

interface Props {
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryModal: React.FC<Props> = ({ category, onClose, onSuccess }) => {
  const [name, setName] = useState(category?.name ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}

    setLoading(true);
    try {
      const payload: Partial<Category> = { name };
      if (category) {payload.id = category.id;}

      const res = await api.menu.upsertCategory(payload);
      if (res.success) {onSuccess();}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="category-form" onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name</label>
        <input 
          type="text"
          required
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g. Starters"
          autoFocus
        />
      </div>

      <div className="-mx-6 -mb-4 px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-8">
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button variant="primary" type="submit" isLoading={loading}>
          Save
        </Button>
      </div>
    </form>
  );
};

export default CategoryModal;
