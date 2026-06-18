import { Input, Toggle } from '../../../components/atoms';
import React, { useState } from 'react';
import { api } from '../../../lib/ipc';
import { Menu } from '../../../types/models';
import { useToast } from '../../../hooks/useToast';

interface Props {
  menu: Menu | null;
  onSuccess: () => void;
}

const MenuModal: React.FC<Props> = ({ menu, onSuccess }) => {
  const { showToast } = useToast();
  const [name, setName] = useState(menu?.name ?? '');
  const [isDefault, setIsDefault] = useState(menu?.is_default === 1);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name) {
      showToast({ message: 'Name is required', variant: 'warning' });
      return;
    }

    try {
      const res = await api.menu.upsertMenu({
        id: menu?.id,
        name,
        is_default: isDefault ? 1 : 0
      });

      if (res.success) {
        showToast({ message: 'Menu saved successfully', variant: 'success' });
        onSuccess();
      } else {
        showToast({ message: res.error ?? 'Failed to save menu', variant: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'An unexpected error occurred', variant: 'error' });
    }
  };

  return (
    <form id="menu-form" onSubmit={(e) => { void handleSubmit(e); }} className="p-4 space-y-4">
      <Input 
        label="Menu Name" 
        value={name} 
        onChange={(e) => { setName(e.target.value); }} 
        placeholder="e.g. Night Menu"
        autoFocus
        required
      />
      <Toggle 
        label="Make Default Menu" 
        description="This menu will load automatically on the Order screen."
        checked={isDefault} 
        onChange={(e) => { setIsDefault(e.target.checked); }} 
      />
    </form>
  );
};

export default MenuModal;
