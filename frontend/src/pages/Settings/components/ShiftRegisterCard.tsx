import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/atoms/card';
import { Button } from '../../../components/atoms';
import { useAuthStore } from '../../../store/auth';
import { useModal } from '../../../hooks/useModal';
import CloseShiftModal from './CloseShiftModal';

const ShiftRegisterCard: React.FC = () => {
  const activeShift = useAuthStore(state => state.activeShift);
  const { showModal, hideModal } = useModal();
  const [isEnabled, setIsEnabled] = React.useState(true);

  React.useEffect(() => {
    // We can't easily import api at top level if not already imported. Wait, api is imported!
    void import('../../../lib/ipc').then(m => {
      void m.api.settings.get().then(res => {
        if (res.success && res.data) {
          setIsEnabled((res.data as Record<string, unknown>).is_shift_tracking_enabled !== false);
        }
      });
    });
    
    const handleSettingsUpdate = () => {
      void import('../../../lib/ipc').then(m => {
        void m.api.settings.get().then(res => {
          if (res.success && res.data) {
            setIsEnabled((res.data as Record<string, unknown>).is_shift_tracking_enabled !== false);
          }
        });
      });
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => { window.removeEventListener('settings-updated', handleSettingsUpdate); };
  }, []);

  if (!isEnabled) {
    return null;
  }

  return (
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
  );
};

export default ShiftRegisterCard;
