import { Button, Input, Toggle } from '../../components/atoms';
import React, { useState } from 'react';
import { api } from '../../lib/ipc';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/atoms/card';
import { useAuthStore } from '../../store/auth';
import CloseShiftModal from './components/CloseShiftModal';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';

const SettingsPage: React.FC = () => {
  const activeShift = useAuthStore(state => state.activeShift);
  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  React.useEffect(() => {
    void api.settings.get().then(res => {
      if (res.success && res.data) {
        setSettings(res.data as Record<string, unknown>);
      }
    });
  }, []);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.backup.export({});
      if (res.success && res.data) {
        showToast({ message: `Backup exported successfully to ${res.data as string}`, variant: 'success' });
      } else if (res.error !== 'Export cancelled') {
        showToast({ message: res.error ?? 'Failed to export backup', variant: 'error' });
      }
    } catch (err) {
      console.error(err);
      showToast({ message: 'Failed to export backup', variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await api.backup.import({});
      if (res.success) {
        showToast({ message: 'Backup imported! App will restart now.', variant: 'success' });
      } else if (res.error !== 'Import cancelled') {
        showToast({ message: res.error ?? 'Failed to import backup', variant: 'error' });
      }
    } catch (err) {
      console.error(err);
      showToast({ message: 'Failed to import backup', variant: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container-responsive p-6 max-w-2xl mx-auto relative">
      {(isExporting || isImporting) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-800">
            {isExporting ? 'Exporting Backup...' : 'Importing Backup...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Please wait, do not close the application.</p>
        </div>
      )}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Outlet Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <Input label="Outlet Name" placeholder="My Restaurant" />
             <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Printer</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={() => { 
              void api.print.kot({
                tableName: 'TEST PAGE',
                items: [
                  { name: 'System Print Test', qty: 1 }
                ],
                orderNote: 'If you can read this, printing is working!'
              }); 
            }} className="w-full text-left justify-start">
              Test Print
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup & Restore</CardTitle>
          </CardHeader>
          <CardContent className="space-x-4">
            <Button variant="secondary" onClick={() => { void handleExport(); }} disabled={isExporting || isImporting}>
               {isExporting ? 'Exporting...' : 'Export Backup'}
            </Button>
            <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-50 disabled:opacity-50" onClick={() => { void handleImport(); }} disabled={isExporting || isImporting}>
               {isImporting ? 'Importing...' : 'Import Backup'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shift Register</CardTitle>
          </CardHeader>
          <CardContent>
            {activeShift ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Register is currently <strong>Open</strong> since{' '}
                  <strong>{new Date(activeShift.opened_at).toLocaleString()}</strong>.
                </p>
                <Button variant="danger" onClick={() => { 
                  showModal({
                  title: 'Close Shift Register',
                  content: <CloseShiftModal onSuccess={hideModal} />,
                  actions: (
                    <>
                      <Button variant="outline" onClick={hideModal}>Cancel</Button>
                      <Button type="submit" form="close-shift-form" variant="danger">Reconcile & Close Shift</Button>
                    </>
                  )
                });
                }}>
                  Close Shift Register
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Register is currently Closed. Shift opens automatically on login.</p>
            )}
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
          <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
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
          </div>
            </div>
            <Toggle
              checked={settings.inventory_auto_debit !== false}
              onChange={(e) => {
                void (async () => {
                  try {
                    const val = e.target.checked;
                    setSettings({ ...settings, inventory_auto_debit: val });
                    await api.settings.save({ inventory_auto_debit: val });
                    showToast({ message: 'Settings saved', variant: 'success' });
                  } catch (err) {
                    console.error(err);
                    showToast({ message: 'Failed to save settings', variant: 'error' });
                  }
                })();
              }}
            />
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default SettingsPage;
