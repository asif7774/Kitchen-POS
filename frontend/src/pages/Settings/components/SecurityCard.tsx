import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/atoms/card';
import { Button, Input } from '../../../components/atoms';
import { useAuthStore } from '../../../store/auth';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../lib/ipc';

const SecurityCard: React.FC = () => {
  const staff = useAuthStore((state) => state.staff);
  const { showToast } = useToast();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');

  if (!staff) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Change My PIN</h3>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <Input type="password" placeholder="Current PIN" value={currentPin} onChange={(e) => { setCurrentPin(e.target.value); }} />
            <Input type="password" placeholder="New PIN (4 digits)" value={newPin} onChange={(e) => { setNewPin(e.target.value); }} />
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            disabled={!currentPin || newPin.length !== 4} 
            onClick={() => {
              void api.staff.changePin({ id: staff.id, currentPin, newPin }).then(res => {
                if (res.success) {
                  showToast({ message: 'PIN changed successfully', variant: 'success' });
                  setCurrentPin('');
                  setNewPin('');
                } else {
                  showToast({ message: res.error ?? 'Failed to change PIN', variant: 'error' });
                }
              }).catch(console.error);
            }}
          >
            Update PIN
          </Button>
        </div>
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">PIN Recovery</h3>
          <p className="text-xs text-gray-500 max-w-lg">
            If you ever forget your PIN, you can use a Recovery Code to reset the Admin PIN. Generate a new recovery code and save it securely. (This will overwrite any previously generated code).
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              void api.system.generateRecoveryCode().then(res => {
                if (res.success) {
                  showToast({ message: 'Recovery Code generated and saved successfully', variant: 'success' });
                } else if (res.error !== 'Cancelled') {
                  showToast({ message: res.error ?? 'Failed to generate code', variant: 'error' });
                }
              }).catch(console.error);
            }}
          >
            Generate New Recovery Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityCard;
