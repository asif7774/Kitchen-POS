import React from 'react';
import { api } from '../../lib/ipc';
import Button from '../../components/atoms/button/button';

const SettingsPage: React.FC = () => {
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
             <div>
                <label className="block text-sm font-medium text-gray-700">Outlet Name</label>
                <input type="text" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" placeholder="My Restaurant" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                <input type="text" className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" placeholder="22AAAAA0000A1Z5" />
             </div>
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
      </div>
    </div>
  );
};

export default SettingsPage;
