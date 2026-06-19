import { useState, useEffect } from 'react';
import { api } from '../../../lib/ipc';
import { useToast } from '../../../hooks/useToast';
import { AutoBackupConfig, BackupReminderConfig } from '../../../types/models';

export const DEFAULT_AUTO_BACKUP: AutoBackupConfig = { enabled: false, frequency: 'daily', path: null, dayOfWeek: 1, lastBackupAt: null };
export const DEFAULT_REMINDER: BackupReminderConfig = { enabled: false, frequency: 'daily', time: '20:00', dayOfWeek: 1, dayOfMonth: 1, lastRemindedDate: null };

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useBackupSettings() {
  const { showToast } = useToast();
  const [autoBackup, setAutoBackup] = useState<AutoBackupConfig>(DEFAULT_AUTO_BACKUP);
  const [reminder, setReminder] = useState<BackupReminderConfig>(DEFAULT_REMINDER);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
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
    try {
      const res = await api.backup.triggerNow();
      if (res.success) {
        showToast({ message: 'Backup completed successfully', variant: 'success' });
      } else {
        showToast({ message: res.error ?? 'Backup failed', variant: 'error' });
      }
    } catch {
      showToast({ message: 'Backup failed', variant: 'error' });
    } finally {
      setIsBackingUp(false);
    }
  };

  return {
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
  };
}
