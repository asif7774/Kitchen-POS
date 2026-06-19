import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/atoms/card';
import { Button, Input, Toggle } from '../../../components/atoms';
import { useBackupSettings, DAY_NAMES } from '../hooks/useBackupSettings';
import { useModal } from '../../../hooks/useModal';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../lib/ipc';

const DataAndBackupsCard: React.FC = () => {
  const {
    autoBackup,
    reminder,
    isExporting,
    setIsExporting,
    isImporting,
    setIsImporting,
    isBackingUp,
    saveAutoBackup,
    saveReminder,
    handleSelectBackupPath,
    handleBackupNow
  } = useBackupSettings();

  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data & Backups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Manual Backup</h3>
          <div className="flex gap-2 flex-wrap">
            <Button variant="primary" onClick={() => { void handleBackupNow(); }} disabled={isBackingUp || isExporting || isImporting}>
              {isBackingUp ? 'Backing up... Do not close' : 'Back Up Now'}
            </Button>
            <Button variant="outline" onClick={() => {
              void (async () => {
                setIsExporting(true);
                try {
                  const res = await api.backup.export({});
                  if (res.success) {
                    showToast({ message: `Backup exported to ${res.data as string}`, variant: 'success' });
                  } else {
                    showToast({ message: res.error ?? 'Failed to export backup', variant: 'error' });
                  }
                } catch {
                  showToast({ message: 'Failed to export backup', variant: 'error' });
                } finally {
                  setIsExporting(false);
                }
              })();
            }}>
              {isExporting ? 'Exporting... Do not close' : 'Export Backup'}
            </Button>
            <Button variant="outline" disabled={isBackingUp || isExporting || isImporting} onClick={() => {
              showModal({
                title: 'Import Backup',
                content: <p className="text-sm text-gray-600">Warning: Importing a backup will overwrite ALL current data and close the app. Continue?</p>,
                actions: (
                  <>
                    <Button variant="secondary" onClick={hideModal}>Cancel</Button>
                    <Button variant="danger" onClick={() => {
                      void (async () => {
                        hideModal();
                        setIsImporting(true);
                        try {
                          const res = await api.backup.import({});
                          if (res.success) {
                            showToast({ message: 'Backup imported. App will restart.', variant: 'success' });
                          } else if (res.error && res.error !== 'Import cancelled') {
                            showToast({ message: res.error, variant: 'error' });
                          }
                        } catch {
                          showToast({ message: 'Failed to import backup', variant: 'error' });
                        } finally {
                          setIsImporting(false);
                        }
                      })();
                    }}>
                      Yes, Import
                    </Button>
                  </>
                )
              });
            }}>
              {isImporting ? 'Importing... Do not close' : 'Import Backup'}
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Auto-Backup</h3>
          <Toggle
            checked={autoBackup.enabled}
            onChange={(e) => { void saveAutoBackup({ enabled: e.target.checked }); }}
            label="Enable Auto-Backup"
            description="Automatically back up your data on a schedule"
          />
          {autoBackup.enabled && (
            <div className="pl-4 space-y-3 border-l-2 border-gray-100">
              <div className="flex gap-2">
                {(['daily', 'weekly'] as const).map(f => (
                  <Button
                    key={f}
                    size="sm"
                    variant={autoBackup.frequency === f ? 'primary' : 'outline'}
                    onClick={() => { void saveAutoBackup({ frequency: f }); }}
                    className="capitalize"
                  >
                    {f}
                  </Button>
                ))}
              </div>
              {autoBackup.frequency === 'weekly' && (
                <div className="flex gap-2 flex-wrap">
                  {DAY_NAMES.map((name, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant={autoBackup.dayOfWeek === idx ? 'secondary' : 'ghost'}
                      onClick={() => { void saveAutoBackup({ dayOfWeek: idx }); }}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 flex-1 truncate">
                  {autoBackup.path ?? 'Default folder (app data)'}
                </span>
                <Button size="sm" variant="outline" onClick={() => { void handleSelectBackupPath(); }}>
                  Change Folder
                </Button>
              </div>
              {autoBackup.lastBackupAt && (
                <p className="text-xs text-gray-500">
                  Last backup: {new Date(autoBackup.lastBackupAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Backup Reminder</h3>
          <Toggle
            checked={reminder.enabled}
            onChange={(e) => { void saveReminder({ enabled: e.target.checked }); }}
            label="Enable Backup Reminder"
            description="Get a notification reminding you to back up"
          />
          {reminder.enabled && (
            <div className="pl-4 space-y-3 border-l-2 border-gray-100">
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map(f => (
                  <Button
                    key={f}
                    size="sm"
                    variant={reminder.frequency === f ? 'primary' : 'outline'}
                    onClick={() => { void saveReminder({ frequency: f }); }}
                    className="capitalize"
                  >
                    {f}
                  </Button>
                ))}
              </div>
              <Input
                label="Reminder Time"
                type="time"
                value={reminder.time}
                onChange={(e) => { void saveReminder({ time: e.target.value }); }}
              />
              {reminder.frequency === 'weekly' && (
                <div className="flex gap-2 flex-wrap">
                  {DAY_NAMES.map((name, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant={reminder.dayOfWeek === idx ? 'secondary' : 'ghost'}
                      onClick={() => { void saveReminder({ dayOfWeek: idx }); }}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              )}
              {reminder.frequency === 'monthly' && (
                <Input
                  label="Day of Month"
                  type="number"
                  value={String(reminder.dayOfMonth)}
                  onChange={(e) => { void saveReminder({ dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value))) }); }}
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataAndBackupsCard;
