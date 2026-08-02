import { useMutation } from './useMutation';
import { api } from '../lib/ipc';

export function useBackupActions() {
  const exportBackup = useMutation(api.backup.export, {
    successMessage: (data) => `Backup exported to ${data as string}`,
    errorMessage: (err) => err,
  });

  const importBackup = useMutation(api.backup.import, {
    successMessage: 'Backup imported. App will restart.',
    errorMessage: (err) => err === 'Import cancelled' ? '' : err,
  });

  return {
    exportBackup: () => exportBackup.mutate({}),
    importBackup: () => importBackup.mutate({}),
    isExporting: exportBackup.isLoading,
    isImporting: importBackup.isLoading,
  };
}
