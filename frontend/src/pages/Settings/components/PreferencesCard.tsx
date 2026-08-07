import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/atoms/card';
import { Toggle, Button } from '../../../components/atoms';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../lib/ipc';

const PreferencesCard: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Dark mode and notifications are local state for now, but we save other settings
    const res = await api.settings.save(settings);
    setIsSaving(false);
    if (res.success) {
      showToast({ message: 'General settings saved successfully', variant: 'success' });
    } else {
      showToast({ message: 'Failed to save settings', variant: 'error' });
    }
  };

  useEffect(() => {
    void api.settings.get().then(res => {
      if (res.success && res.data) {
        setSettings(res.data as Record<string, unknown>);
      }
    });
  }, []);

  return (
    <>



      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="Auto-Debit Inventory on KOT"
            description="Automatically deduct ingredients from stock when an order is sent to the kitchen."
            checked={settings.inventory_auto_debit !== false}
            onChange={(e) => {
              void (async () => {
                try {
                  const val = e.target.checked;
                  setSettings({ ...settings, inventory_auto_debit: val });
                  const res = await api.settings.save({ inventory_auto_debit: val });
                  if (res.success) {
                    showToast({ message: `Auto-Debit Inventory on KOT ${val ? 'enabled' : 'disabled'}`, variant: 'success' });
                  } else {
                    showToast({ message: 'Failed to save Auto-Debit settings', variant: 'error' });
                  }
                } catch (err) {
                  console.error(err);
                  showToast({ message: 'Failed to update Auto-Debit setting', variant: 'error' });
                }
              })();
            }}
          />
          <Toggle
            checked={notificationsEnabled}
            onChange={(e) => { 
              setNotificationsEnabled(e.target.checked); 
              showToast({ message: `Notifications ${e.target.checked ? 'enabled' : 'disabled'}`, variant: 'success' });
            }}
            label="Enable Notifications"
            description="Receive alerts for low inventory"
          />
          <Toggle
            checked={darkModeEnabled}
            onChange={(e) => { 
              setDarkModeEnabled(e.target.checked); 
              showToast({ message: `Dark mode ${e.target.checked ? 'enabled' : 'disabled'}`, variant: 'success' });
            }}
            label="Dark Mode"
            description="Switch between light and dark themes"
          />
          <Toggle
            checked={settings.is_kds_enabled !== false}
            onChange={(e) => { 
              const is_kds_enabled = e.target.checked;
              const newSettings = { ...settings, is_kds_enabled };
              setSettings(newSettings);
              void api.settings.save(newSettings).then(res => {
                if (res.success) {
                  showToast({ message: `KDS ${is_kds_enabled ? 'enabled' : 'disabled'}`, variant: 'success' });
                  window.dispatchEvent(new Event('settings-updated'));
                } else {
                  showToast({ message: 'Failed to update KDS settings', variant: 'error' });
                }
              });
            }}
            label="Enable KDS"
            description="Show the Kitchen Display System in the sidebar"
          />
          <Toggle
            checked={settings.is_shift_tracking_enabled !== false}
            onChange={(e) => { 
              const is_shift_tracking_enabled = e.target.checked;
              const newSettings = { ...settings, is_shift_tracking_enabled };
              setSettings(newSettings);
              void api.settings.save(newSettings).then(res => {
                if (res.success) {
                  showToast({ message: `Shift Tracking ${is_shift_tracking_enabled ? 'enabled' : 'disabled'}`, variant: 'success' });
                  window.dispatchEvent(new Event('settings-updated'));
                } else {
                  showToast({ message: 'Failed to update Shift settings', variant: 'error' });
                }
              });
            }}
            label="Enable Shift Register"
            description="Require an open shift to take orders and track till balances"
          />
          <div className="pt-2 border-t border-gray-100">
            <Button variant="primary" onClick={() => { void handleSave(); }} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default PreferencesCard;
