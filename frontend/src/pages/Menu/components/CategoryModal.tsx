import { Input } from '../../../components/atoms';
import React, { useState } from 'react';
import { Category } from '../../../types/models';

import { api } from '../../../lib/ipc';
import { useToast } from '../../../hooks/useToast';

interface Props {
  category: Category | null;

  onSuccess: () => void;
}

const CategoryModal: React.FC<Props> = ({ category, onSuccess }) => {
  const [name, setName] = useState(category?.name ?? '');

  const { showToast } = useToast();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}


    try {
      const payload: Partial<Category> = { name };
      if (category) {payload.id = category.id;}

      const res = await api.menu.upsertCategory(payload);
      if (res.success) {
        showToast({ message: 'Category saved successfully', variant: 'success' });
        onSuccess();
      } else {
        showToast({ message: res.error ?? 'Failed to save category', variant: 'error' });
      }
    } catch (err) {
      console.error(err);
      showToast({ message: 'An unexpected error occurred', variant: 'error' });
    }
  };

  return (
    <form id="category-form" onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div className="mb-6">
        <Input 
          label="Category Name"
          type="text"
          required
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          placeholder="e.g. Starters"
          autoFocus
        />
      </div>

    </form>
  );
};

export default CategoryModal;
