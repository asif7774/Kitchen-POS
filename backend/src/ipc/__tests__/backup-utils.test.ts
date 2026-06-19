import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  pruneOldBackups,
  checkShouldFireReminder,
  formatLocalDate,
  BACKUP_FILE_PATTERN,
  type BackupReminderConfig,
} from '../backup-utils';

// ─── helpers ────────────────────────────────────────────────────────────────

function backupName(ts: string): string {
  // e.g. "2024-01-15T10-30-00" → "kitchen-pos-backup-2024-01-15T10-30-00.db"
  return `kitchen-pos-backup-${ts}.db`;
}

function makeBackupFile(dir: string, ts: string, mtimeOffset = 0): string {
  const filePath = path.join(dir, backupName(ts));
  fs.writeFileSync(filePath, '');
  if (mtimeOffset !== 0) {
    const t = new Date(Date.now() - mtimeOffset);
    fs.utimesSync(filePath, t, t);
  }
  return filePath;
}

function listBackups(dir: string): string[] {
  return fs.readdirSync(dir).filter(f => BACKUP_FILE_PATTERN.test(f)).sort();
}

function baseReminder(overrides: Partial<BackupReminderConfig> = {}): BackupReminderConfig {
  return {
    enabled: true,
    frequency: 'daily',
    time: '20:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    lastRemindedDate: null,
    ...overrides,
  };
}

// ─── pruneOldBackups ────────────────────────────────────────────────────────

describe('pruneOldBackups', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-backup-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('keeps all files when count is under the limit', () => {
    makeBackupFile(tmpDir, '2024-01-01T10-00-00');
    makeBackupFile(tmpDir, '2024-01-02T10-00-00');

    pruneOldBackups(tmpDir, 7);

    expect(listBackups(tmpDir)).toHaveLength(2);
  });

  it('keeps exactly keepCount files when count equals the limit', () => {
    for (let i = 1; i <= 7; i++) {
      makeBackupFile(tmpDir, `2024-01-${String(i).padStart(2, '0')}T10-00-00`, i * 1000);
    }

    pruneOldBackups(tmpDir, 7);

    expect(listBackups(tmpDir)).toHaveLength(7);
  });

  it('deletes the oldest files when over the limit', () => {
    // 10 files, oldest first by mtime offset (higher offset = older)
    for (let i = 1; i <= 10; i++) {
      makeBackupFile(tmpDir, `2024-01-${String(i).padStart(2, '0')}T10-00-00`, (11 - i) * 1000);
    }

    pruneOldBackups(tmpDir, 7);

    const remaining = listBackups(tmpDir);
    expect(remaining).toHaveLength(7);
    // Newest 7 by mtime should survive (days 4–10, since day 1 is oldest)
    expect(remaining).toContain(backupName('2024-01-10T10-00-00'));
    expect(remaining).not.toContain(backupName('2024-01-01T10-00-00'));
    expect(remaining).not.toContain(backupName('2024-01-02T10-00-00'));
    expect(remaining).not.toContain(backupName('2024-01-03T10-00-00'));
  });

  it('does not delete files that do not match the backup pattern', () => {
    makeBackupFile(tmpDir, '2024-01-01T10-00-00');
    // Unrelated files — not matching pattern
    fs.writeFileSync(path.join(tmpDir, 'other.db'), '');
    fs.writeFileSync(path.join(tmpDir, 'notes.txt'), '');

    pruneOldBackups(tmpDir, 0); // keepCount=0 deletes all matching files

    expect(fs.existsSync(path.join(tmpDir, 'other.db'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'notes.txt'))).toBe(true);
    expect(listBackups(tmpDir)).toHaveLength(0);
  });

  it('does not crash when the directory is empty', () => {
    expect(() => { pruneOldBackups(tmpDir, 7); }).not.toThrow();
  });

  it('does not crash when the directory does not exist', () => {
    expect(() => { pruneOldBackups('/nonexistent/path/xyz', 7); }).not.toThrow();
  });

  it('deletes no files when keepCount is larger than file count', () => {
    makeBackupFile(tmpDir, '2024-01-01T10-00-00');
    makeBackupFile(tmpDir, '2024-01-02T10-00-00');
    makeBackupFile(tmpDir, '2024-01-03T10-00-00');

    pruneOldBackups(tmpDir, 100);

    expect(listBackups(tmpDir)).toHaveLength(3);
  });
});

// ─── checkShouldFireReminder ────────────────────────────────────────────────

describe('checkShouldFireReminder', () => {
  // Wednesday 2024-01-17 20:00 local
  const wed20h = new Date(2024, 0, 17, 20, 0, 0);

  it('returns false when reminder is disabled', () => {
    const cfg = baseReminder({ enabled: false });
    expect(checkShouldFireReminder(cfg, wed20h)).toBe(false);
  });

  it('returns false when already reminded today', () => {
    const cfg = baseReminder({ lastRemindedDate: '2024-01-17' });
    expect(checkShouldFireReminder(cfg, wed20h)).toBe(false);
  });

  it('returns false when the hour does not match', () => {
    const cfg = baseReminder({ time: '20:00' });
    const notYet = new Date(2024, 0, 17, 19, 59, 0);
    expect(checkShouldFireReminder(cfg, notYet)).toBe(false);
  });

  it('returns false when the minute does not match', () => {
    const cfg = baseReminder({ time: '20:01' });
    expect(checkShouldFireReminder(cfg, wed20h)).toBe(false);
  });

  describe('daily frequency', () => {
    it('fires when enabled, time matches, and not yet reminded today', () => {
      const cfg = baseReminder({ frequency: 'daily', time: '20:00', lastRemindedDate: null });
      expect(checkShouldFireReminder(cfg, wed20h)).toBe(true);
    });

    it('fires on a different day from lastRemindedDate', () => {
      const cfg = baseReminder({ frequency: 'daily', time: '20:00', lastRemindedDate: '2024-01-16' });
      expect(checkShouldFireReminder(cfg, wed20h)).toBe(true);
    });
  });

  describe('weekly frequency', () => {
    it('fires on the configured day of week', () => {
      // Wednesday = 3
      const cfg = baseReminder({ frequency: 'weekly', time: '20:00', dayOfWeek: 3 });
      expect(checkShouldFireReminder(cfg, wed20h)).toBe(true);
    });

    it('does not fire on a different day of week', () => {
      // dayOfWeek = 1 (Monday) but date is Wednesday
      const cfg = baseReminder({ frequency: 'weekly', time: '20:00', dayOfWeek: 1 });
      expect(checkShouldFireReminder(cfg, wed20h)).toBe(false);
    });
  });

  describe('monthly frequency', () => {
    it('fires on the configured day of month', () => {
      // January 17
      const cfg = baseReminder({ frequency: 'monthly', time: '20:00', dayOfMonth: 17 });
      expect(checkShouldFireReminder(cfg, wed20h)).toBe(true);
    });

    it('does not fire on a different day of month', () => {
      const cfg = baseReminder({ frequency: 'monthly', time: '20:00', dayOfMonth: 1 });
      expect(checkShouldFireReminder(cfg, wed20h)).toBe(false);
    });
  });
});

// ─── formatLocalDate ────────────────────────────────────────────────────────

describe('formatLocalDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatLocalDate(new Date(2024, 0, 5))).toBe('2024-01-05');
  });

  it('zero-pads single-digit month and day', () => {
    expect(formatLocalDate(new Date(2024, 8, 3))).toBe('2024-09-03');
  });
});
