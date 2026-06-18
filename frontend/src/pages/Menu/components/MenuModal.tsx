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
  const [isActive, setIsActive] = useState(menu?.is_active !== 0); // Defaults to true if new
  const [scheduleEnabled, setScheduleEnabled] = useState(menu?.schedule_enabled === 1);
  const [autoEnableTime, setAutoEnableTime] = useState(menu?.auto_enable_time ?? '');
  const [autoDisableTime, setAutoDisableTime] = useState(menu?.auto_disable_time ?? '');

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
        is_default: isDefault ? 1 : 0,
        is_active: isActive ? 1 : 0,
        schedule_enabled: scheduleEnabled ? 1 : 0,
        auto_enable_time: scheduleEnabled ? autoEnableTime : null,
        auto_disable_time: scheduleEnabled ? autoDisableTime : null,
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
      <Toggle 
        label="Is Active" 
        description="Disabled menus will not appear on the Order screen."
        checked={isActive} 
        onChange={(e) => { setIsActive(e.target.checked); }} 
      />
      <div className="border-t pt-4 mt-4">
        <Toggle 
          label="Enable Auto-Schedule" 
          description="Automatically enable or disable this menu based on time."
          checked={scheduleEnabled} 
          onChange={(e) => { setScheduleEnabled(e.target.checked); }} 
        />
        {scheduleEnabled && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input 
              type="time"
              label="Enable At" 
              value={autoEnableTime} 
              onChange={(e) => { setAutoEnableTime(e.target.value); }} 
              required={scheduleEnabled}
            />
            <Input 
              type="time"
              label="Disable At" 
              value={autoDisableTime} 
              onChange={(e) => { setAutoDisableTime(e.target.value); }} 
              required={scheduleEnabled}
            />
          </div>
        )}
      </div>
    </form>
  );
};

export default MenuModal;
