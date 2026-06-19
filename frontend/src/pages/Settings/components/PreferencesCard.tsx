import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/atoms/card';
import { Toggle } from '../../../components/atoms';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../lib/ipc';

const PreferencesCard: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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
          <CardTitle>Taxes & Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <Toggle
            checked={settings.is_gst_enabled !== false}
            onChange={(e) => { 
              const is_gst_enabled = e.target.checked;
              const newSettings = { ...settings, is_gst_enabled };
              setSettings(newSettings);
              void api.settings.save(newSettings).then((res) => {
                if (res.success) {
                  showToast({ message: `GST / SGST ${is_gst_enabled ? 'enabled' : 'disabled'}`, variant: 'success' });
                } else {
                  showToast({ message: 'Failed to update GST settings', variant: 'error' });
                }
              });
            }}
            label="Enable GST / SGST"
            description="Calculate and show CGST and SGST on bills"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700">Auto-Debit Inventory on KOT</p>
            <p className="text-sm text-gray-500">Automatically deduct ingredients from stock when an order is sent to the kitchen.</p>
          </div>
          <Toggle
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </>
  );
};

export default PreferencesCard;
