import { Input } from '../../../components/atoms';
import React, { useState } from 'react';
import { api } from '../../../lib/ipc';
import { Menu } from '../../../types/models';
import { useToast } from '../../../hooks/useToast';

interface Props {
  sourceMenu: Menu;
  onSuccess: (newId: number) => void;
}

const CloneMenuModal: React.FC<Props> = ({ sourceMenu, onSuccess }) => {
  const { showToast } = useToast();
  const [name, setName] = useState(`${sourceMenu.name} (Copy)`);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name) {
      showToast({ message: 'Name is required', variant: 'warning' });
      return;
    }

    try {
      const res = await api.menu.duplicateMenu({
        id: sourceMenu.id,
        newName: name
      });

      if (res.success && res.data) {
        showToast({ message: 'Menu duplicated successfully', variant: 'success' });
        onSuccess(res.data.id);
      } else {
        showToast({ message: res.error ?? 'Failed to duplicate menu', variant: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'An unexpected error occurred', variant: 'error' });
    }
  };

  return (
    <form id="clone-menu-form" onSubmit={(e) => { void handleSubmit(e); }} className="p-4 space-y-4">
      <Input 
        label="New Menu Name" 
        value={name} 
        onChange={(e) => { setName(e.target.value); }} 
        placeholder="e.g. Night Menu"
        autoFocus
        required
      />
    </form>
  );
};

export default CloneMenuModal;
