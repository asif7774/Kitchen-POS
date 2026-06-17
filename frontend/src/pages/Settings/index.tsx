import React, { useState } from 'react';
import { api } from '../../lib/ipc';
import Button from '../../components/atoms/button/button';
import Input from '../../components/atoms/input/input';
import { useAuthStore } from '../../store/auth';
import CloseShiftModal from './components/CloseShiftModal';
import { useModal } from '../../hooks/useModal';

const SettingsPage: React.FC = () => {
  const activeShift = useAuthStore(state => state.activeShift);
  const { showModal, hideModal } = useModal();
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  React.useEffect(() => {
    void api.settings.get().then(res => {
      if (res.success && res.data) {
        setSettings(res.data as Record<string, unknown>);
      }
    });
  }, []);

  const handleExport = async () => {
    await api.backup.export({});
  };

  return (
    <div className="container-responsive p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-8">
        <section className="card p-6 shadow-sm border rounded">
          <h2 className="text-lg font-medium border-b pb-2 mb-4">Outlet Details</h2>
          <div className="space-y-4">
             <Input label="Outlet Name" placeholder="My Restaurant" />
             <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" />
          </div>
        </section>

        <section className="card p-6 shadow-sm border rounded">
          <h2 className="text-lg font-medium border-b pb-2 mb-4">Printer</h2>
          <Button variant="secondary" onClick={() => { void Promise.resolve(); }} className="w-full text-left justify-start">
            Test Print
          </Button>
        </section>

        <section className="card p-6 shadow-sm border rounded">
          <h2 className="text-lg font-medium border-b pb-2 mb-4">Backup & Restore</h2>
          <div className="space-x-4">
            <Button variant="secondary" onClick={() => { void handleExport(); }}>
               Export Backup
            </Button>
            <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-50">
               Import Backup
            </Button>
          </div>
        </section>

        <section className="card p-6 shadow-sm border rounded">
          <h2 className="text-lg font-medium border-b pb-2 mb-4">Shift Register</h2>
          {activeShift ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Register is currently <strong>Open</strong> since{' '}
                <strong>{new Date(activeShift.opened_at).toLocaleString()}</strong>.
              </p>
              <Button variant="danger" onClick={() => { 
                showModal({
                  title: '',
                  content: <CloseShiftModal onClose={hideModal} />
                });
              }}>
                Close Shift Register
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Register is currently Closed. Shift opens automatically on login.</p>
          )}
        </section>

        <section className="card p-6 shadow-sm border rounded">
          <h2 className="text-lg font-medium border-b pb-2 mb-4">Inventory Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Auto-Debit Inventory on KOT</p>
              <p className="text-sm text-gray-500">Automatically deduct ingredients from stock when an order is sent to the kitchen.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.inventory_auto_debit !== false}
                onChange={(e) => {
                  void (async () => {
                    const val = e.target.checked;
                    setSettings({ ...settings, inventory_auto_debit: val });
                    await api.settings.save({ inventory_auto_debit: val });
                  })();
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </section>
      </div>

    </div>
  );
};

export default SettingsPage;
