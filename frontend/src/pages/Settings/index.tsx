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
  const [autoBackup, setAutoBackup] = useState<AutoBackupConfig>(DEFAULT_AUTO_BACKUP);
  const [reminder, setReminder] = useState<BackupReminderConfig>(DEFAULT_REMINDER);

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
    } catch {
      showToast({ message: 'Failed to save auto-backup settings', variant: 'error' });
    }
  };

  const saveReminder = async (patch: Partial<BackupReminderConfig>) => {
    const updated = { ...reminder, ...patch };
    setReminder(updated);
    try {
      await api.backup.setAutoBackupConfig({ backupReminder: patch });
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
    const res = await api.backup.triggerNow();
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
                void api.settings.save(newSettings);
              }}
              label="Enable GST / SGST"
              description="Calculate and show CGST and SGST on bills"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              checked={autoBackup.enabled}
              onChange={(e) => { void saveAutoBackup({ enabled: e.target.checked }); }}
              label="Enable Auto-Backup"
              description="Automatically back up your data on a schedule"
            />
            {autoBackup.enabled && (
              <>
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
                    Change
                  </Button>
                </div>
                {autoBackup.lastBackupAt && (
                  <p className="text-xs text-gray-500">
                    Last backup: {new Date(autoBackup.lastBackupAt).toLocaleString()}
                  </p>
                )}
                <Button size="sm" variant="secondary" onClick={() => { void handleBackupNow(); }}>
                  Back Up Now
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup Reminder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              checked={reminder.enabled}
              onChange={(e) => { void saveReminder({ enabled: e.target.checked }); }}
              label="Enable Backup Reminder"
              description="Get a notification reminding you to back up"
            />
            {reminder.enabled && (
              <>
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
              </>
            )}
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
