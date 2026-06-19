import { Button, Input, Toggle } from '../../components/atoms';
import React, { useState } from 'react';
import { api } from '../../lib/ipc';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/atoms/card';
import { useAuthStore } from '../../store/auth';
import CloseShiftModal from './components/CloseShiftModal';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';
import { AutoBackupConfig, BackupReminderConfig } from '../../types/models';

const DEFAULT_AUTO_BACKUP: AutoBackupConfig = { enabled: false, frequency: 'daily', path: null, dayOfWeek: 1, lastBackupAt: null };
const DEFAULT_REMINDER: BackupReminderConfig = { enabled: false, frequency: 'daily', time: '20:00', dayOfWeek: 1, dayOfMonth: 1, lastRemindedDate: null };

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SettingsPage: React.FC = () => {
  const activeShift = useAuthStore(state => state.activeShift);
  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const staff = useAuthStore(state => state.staff);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [autoBackup, setAutoBackup] = useState<AutoBackupConfig>(DEFAULT_AUTO_BACKUP);
  const [reminder, setReminder] = useState<BackupReminderConfig>(DEFAULT_REMINDER);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  React.useEffect(() => {
    void api.settings.get().then(res => {
      if (res.success && res.data) {
        setSettings(res.data as Record<string, unknown>);
      }
    });
    void api.backup.getAutoBackupConfig().then(res => {
      if (res.success && res.data) {
        setAutoBackup(res.data.autoBackup);
        setReminder(res.data.backupReminder);
      }
    });
  }, []);

  const saveAutoBackup = async (patch: Partial<AutoBackupConfig>) => {
    const updated = { ...autoBackup, ...patch };
    setAutoBackup(updated);
    try {
      await api.backup.setAutoBackupConfig({ autoBackup: patch });
      if ('enabled' in patch) {
        showToast({ message: `Auto-Backup ${patch.enabled ? 'enabled' : 'disabled'}`, variant: 'success' });
      } else if ('frequency' in patch) {
        showToast({ message: `Auto-Backup frequency set to ${patch.frequency}`, variant: 'success' });
      } else if ('path' in patch) {
        showToast({ message: `Auto-Backup path updated`, variant: 'success' });
      }
    } catch {
      showToast({ message: 'Failed to save auto-backup settings', variant: 'error' });
    }
  };

  const saveReminder = async (patch: Partial<BackupReminderConfig>) => {
    const updated = { ...reminder, ...patch };
    setReminder(updated);
    try {
      await api.backup.setAutoBackupConfig({ backupReminder: patch });
      if ('enabled' in patch) {
        showToast({ message: `Backup Reminder ${patch.enabled ? 'enabled' : 'disabled'}`, variant: 'success' });
      } else if ('frequency' in patch) {
        showToast({ message: `Backup Reminder frequency set to ${patch.frequency}`, variant: 'success' });
      }
    } catch {
      showToast({ message: 'Failed to save reminder settings', variant: 'error' });
    }
  };

  const handleSelectBackupPath = async () => {
    const res = await api.backup.selectAutoBackupPath();
    if (res.success && res.data) {
      await saveAutoBackup({ path: res.data });
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    const res = await api.backup.triggerNow();
    setIsBackingUp(false);
    if (res.success) {
      showToast({ message: 'Backup completed successfully', variant: 'success' });
    } else {
      showToast({ message: res.error ?? 'Backup failed', variant: 'error' });
    }
  };



  return (
    <div className="container-responsive p-6 max-w-2xl mx-auto relative">

      <div className="space-y-8">
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

        {staff && (
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Change My PIN</h3>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <Input type="password" placeholder="Current PIN" value={currentPin} onChange={e => { setCurrentPin(e.target.value); }} />
                <Input type="password" placeholder="New PIN (4 digits)" value={newPin} onChange={e => { setNewPin(e.target.value); }} />
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                disabled={!currentPin || newPin.length !== 4} 
                onClick={() => {
                  api.staff.changePin({ id: staff.id, currentPin, newPin }).then(res => {
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
              <p className="text-xs text-gray-500 max-w-lg">If you ever forget your PIN, you can use a Recovery Code to reset the Admin PIN. Generate a new recovery code and save it securely. (This will overwrite any previously generated code).</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  api.system.generateRecoveryCode().then(res => {
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
        )}

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
      </div>

    </div>
  );
};

export default SettingsPage;
