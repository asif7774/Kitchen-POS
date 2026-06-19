import * as fs from 'fs';
import * as path from 'path';

export interface BackupReminderConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek: number;
  dayOfMonth: number;
  lastRemindedDate: string | null;
}

export const BACKUP_FILE_PATTERN = /^kitchen-pos-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.zip$/;

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function pruneOldBackups(dir: string, keepCount: number): void {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => BACKUP_FILE_PATTERN.test(f))
      .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);
    files.slice(keepCount).forEach(f => {
      try { fs.unlinkSync(path.join(dir, f.name)); } catch { /* ignore unlink errors */ }
    });
  } catch (e: unknown) {
    console.error('Failed to prune backups:', e instanceof Error ? e.message : e);
  }
}

export function checkShouldFireReminder(config: BackupReminderConfig, now: Date): boolean {
  if (!config.enabled) { return false; }

  const todayStr = formatLocalDate(now);
  if (config.lastRemindedDate === todayStr) { return false; }

  const [configH, configM] = config.time.split(':').map(Number);
  const timeMatch = now.getHours() === configH && now.getMinutes() === configM;
  if (!timeMatch) { return false; }

  if (config.frequency === 'daily') { return true; }
  if (config.frequency === 'weekly') { return now.getDay() === config.dayOfWeek; }
  // monthly
  return now.getDate() === config.dayOfMonth;
}
