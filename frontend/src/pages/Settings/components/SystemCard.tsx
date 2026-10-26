import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/atoms/card';
import { Toggle, Button, Input } from '../../../components/atoms';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../lib/ipc';

const SystemCard: React.FC = () => {
  const { showToast } = useToast();

  const [outletName, setOutletName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void api.settings.get().then(res => {
      if (res.success && res.data) {
        const data = res.data as Record<string, unknown>;
        setOutletName((data.outlet_name as string | undefined) ?? '');
        setGstin((data.gstin as string | undefined) ?? '');
        setAddress((data.address as string | undefined) ?? '');
        setIsGstEnabled(data.is_gst_enabled !== false);
      }
    });
  }, []);

  const handleSaveDetails = async () => {
    setIsSaving(true);
    const res = await api.settings.save({
      outlet_name: outletName,
      gstin,
      address,
      restaurant_name: outletName, // Keep backup compatibility
      is_gst_enabled: isGstEnabled,
    });
    setIsSaving(false);
    if (res.success) {
      showToast({ message: 'Outlet details saved successfully', variant: 'success' });
    } else {
      showToast({ message: res.error ?? 'Failed to save details', variant: 'error' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Outlet Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <Input label="Outlet Name" placeholder="My Restaurant" value={outletName} onChange={e => { setOutletName(e.target.value); }} />
           <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" value={gstin} onChange={e => { setGstin(e.target.value); }} />
           <Input label="Address (Receipts)" placeholder="123 Food St, City" value={address} onChange={e => { setAddress(e.target.value); }} />
           <div className="pt-2 pb-2">
             <Toggle
               checked={isGstEnabled}
               onChange={(e) => { setIsGstEnabled(e.target.checked); }}
               label="Enable GST / SGST"
               description="Calculate and show CGST and SGST on bills"
             />
           </div>
           <div className="pt-2 border-t border-gray-100">
             <Button variant="primary" onClick={() => { void handleSaveDetails(); }} disabled={isSaving}>
               {isSaving ? 'Saving...' : 'Save Details'}
             </Button>
           </div>
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


    </>
  );
};

export default SystemCard;
