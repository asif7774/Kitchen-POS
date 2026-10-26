export interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  path: string | null;
  dayOfWeek: number;
  lastBackupAt: string | null;
}

export interface BackupReminderConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek: number;
  dayOfMonth: number;
  lastRemindedDate: string | null;
}
