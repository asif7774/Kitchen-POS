import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/atoms/card';
import { Button, Input } from '../../../components/atoms';
import { useModal } from '../../../hooks/useModal';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../lib/ipc';

const DangerZoneCard: React.FC = () => {
  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500 mb-2">Factory reset will wipe all data, including menus, sales, customers, and settings. This cannot be undone.</p>
          <Button 
            variant="danger" 
            className="w-fit"
            onClick={() => {
              let confirmText = '';
              showModal({
                title: 'Factory Reset',
                content: (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Please export your backup first using the quick actions button in the bottom right corner.</p>
                    <p className="text-sm text-gray-600 font-bold">To confirm factory reset, type "reset" below:</p>
                    <Input 
                      placeholder="Type reset here"
                      onChange={(e) => { confirmText = e.target.value; }}
                      autoFocus
                    />
                  </div>
                ),
                actions: (
                  <>
                    <Button variant="secondary" onClick={hideModal}>Cancel</Button>
                    <Button 
                      variant="danger" 
                      onClick={() => {
                        if (confirmText.trim().toLowerCase() === 'reset') {
                          hideModal();
                          api.system.factoryReset().catch(console.error);
                        } else {
                          showToast({ message: 'Factory reset cancelled. You did not type "reset".', variant: 'warning' });
                          hideModal();
                        }
                      }}
                    >
                      Confirm Reset
                    </Button>
                  </>
                )
              });
            }}
          >
            Factory Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DangerZoneCard;
