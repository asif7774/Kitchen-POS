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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold">{category ? 'Edit Category' : 'Add Category'}</h2>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-gray-500">✕</Button>
        </div>
        
        <form onSubmit={(e) => { void handleSubmit(e); }} className="p-6">
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

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
