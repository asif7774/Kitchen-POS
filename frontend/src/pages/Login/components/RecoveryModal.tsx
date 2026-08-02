import React, { useState } from 'react';
import { Button, Input } from '../../../components/atoms';
import { useMutation } from '../../../hooks/useMutation';
import { api } from '../../../lib/ipc';

interface RecoveryModalProps {
  onClose: () => void;
}

const RecoveryModal: React.FC<RecoveryModalProps> = ({ onClose }) => {
  const [recoveryStep, setRecoveryStep] = useState<'verify' | 'reset'>('verify');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');

  const verifyMutation = useMutation(api.system.verifyRecoveryCode, {
    onSuccess: () => {
      setRecoveryStep('reset');
    },
    errorMessage: 'Invalid Recovery Code',
  });

  const resetMutation = useMutation(api.system.resetAdminPin, {
    successMessage: 'Admin PIN reset successfully',
    onSuccess: () => {
      onClose();
    },
    errorMessage: (err) => err,
  });

  const handleVerify = () => {
    verifyMutation.mutate({ code: recoveryCode }).catch(() => {});
  };

  const handleReset = () => {
    if (newAdminPin.length !== 4) {
      // Small manual toast logic or just let the API fail. We can throw a manual error to trigger useMutation error handling?
      // Since useMutation handles API responses, for pure UI validation we can just return early or use a local error state.
      // For simplicity, we just won't submit if it's not 4 digits.
      return;
    }
    resetMutation.mutate({ code: recoveryCode, newPin: newAdminPin }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {recoveryStep === 'verify' ? 'Recover Admin PIN' : 'Set New Admin PIN'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {recoveryStep === 'verify' 
              ? 'Enter the recovery code that was generated in Settings.' 
              : 'Enter a new 4-digit PIN for the Admin user.'}
          </p>

          <div className="space-y-4">
            {recoveryStep === 'verify' ? (
              <>
                <Input
                  label="Recovery Code"
                  placeholder="e.g. 12345678"
                  value={recoveryCode}
                  onChange={e => { setRecoveryCode(e.target.value); }}
                  error={verifyMutation.error ?? undefined}
                />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button 
                    variant="primary" 
                    className="flex-1" 
                    onClick={handleVerify}
                    disabled={!recoveryCode || verifyMutation.isLoading}
                  >
                    {verifyMutation.isLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Input
                  label="New Admin PIN"
                  type="password"
                  placeholder="4 digits"
                  maxLength={4}
                  value={newAdminPin}
                  onChange={e => { setNewAdminPin(e.target.value.replace(/\D/g, '')); }}
                  error={newAdminPin.length > 0 && newAdminPin.length < 4 ? 'PIN must be 4 digits' : undefined}
                />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button 
                    variant="primary" 
                    className="flex-1" 
                    onClick={handleReset}
                    disabled={newAdminPin.length !== 4 || resetMutation.isLoading}
                  >
                    {resetMutation.isLoading ? 'Resetting...' : 'Reset PIN'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryModal;
