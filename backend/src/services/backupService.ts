import { getDB } from '../db';
import * as fs from 'fs';
import * as path from 'path';
import Store from 'electron-store';
import archiver from 'archiver';
import extractZip from 'extract-zip';
import { app } from 'electron';
import { BackupReminderConfig, AutoBackupConfig } from '../types/backup';

const DEFAULT_AUTO_BACKUP: AutoBackupConfig = {
  enabled: false,
  frequency: 'daily',
  path: null,
  dayOfWeek: 1,
  lastBackupAt: null,
};

const DEFAULT_REMINDER: BackupReminderConfig = {
  enabled: false,
  frequency: 'daily',
  time: '20:00',
  dayOfWeek: 1,
  dayOfMonth: 1,
  lastRemindedDate: null,
};

export class BackupService {
  async exportBackup(filePath: string): Promise<void> {
    const tempDbPath = path.join(app.getPath('temp'), `pos-temp-${Date.now()}.db`);
    const db = getDB();
    
    try {
      await db.backup(tempDbPath);

      await new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(filePath);
        const createArchive = archiver as any;
        const archive = createArchive('zip', { zlib: { level: 9 } });
        output.on('close', () => { resolve(); });
        archive.on('error', (err: Error) => { reject(err); });
        
        archive.pipe(output);
        archive.file(tempDbPath, { name: 'pos.db' });
        
        const imagesDir = path.join(app.getPath('userData'), 'images');
        if (fs.existsSync(imagesDir)) {
          archive.directory(imagesDir, 'images');
        }
        
        void archive.finalize();
      });
    } finally {
      if (fs.existsSync(tempDbPath)) {
        try { fs.unlinkSync(tempDbPath); } catch (_err) { /* ignore */ }
      }
    }
  }

  async importBackup(importedZip: string): Promise<void> {
    const extractDir = path.join(app.getPath('temp'), `pos-extract-${Date.now()}`);
    try {
      await extractZip(importedZip, { dir: extractDir });

      const extractedDbPath = path.join(extractDir, 'pos.db');
      if (!fs.existsSync(extractedDbPath)) {
        throw new Error('Selected ZIP does not contain pos.db');
      }

      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(extractedDbPath, 'r');
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);

      if (!buffer.toString('utf8').startsWith('SQLite format 3')) {
        throw new Error('The pos.db inside the zip is not a valid SQLite database');
      }

      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'pos.db');

      const db = getDB();
      db.close();

      fs.copyFileSync(extractedDbPath, dbPath);

      // Copy images folder if it exists
      const extractedImagesDir = path.join(extractDir, 'images');
      const destImagesDir = path.join(userDataPath, 'images');
      if (fs.existsSync(extractedImagesDir)) {
        if (!fs.existsSync(destImagesDir)) {
          fs.mkdirSync(destImagesDir, { recursive: true });
        }
        const copyRecursiveSync = (src: string, dest: string) => {
          const exists = fs.existsSync(src);
          const stats = exists && fs.statSync(src);
          const isDirectory = exists && stats && stats.isDirectory();
          if (isDirectory) {
            if (!fs.existsSync(dest)) { fs.mkdirSync(dest); }
            fs.readdirSync(src).forEach(childItemName => {
              copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
            });
          } else {
            fs.copyFileSync(src, dest);
          }
        };
        copyRecursiveSync(extractedImagesDir, destImagesDir);
      }

      const walPath = `${dbPath}-wal`;
      const shmPath = `${dbPath}-shm`;
      if (fs.existsSync(walPath)) { fs.unlinkSync(walPath); }
      if (fs.existsSync(shmPath)) { fs.unlinkSync(shmPath); }

    } finally {
      if (fs.existsSync(extractDir)) {
        try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch (_err) { /* ignore */ }
      }
    }
  }

  getAutoBackupConfig() {
    const store = new Store();
    return {
      autoBackup: store.get('autoBackup', DEFAULT_AUTO_BACKUP) as AutoBackupConfig,
      backupReminder: store.get('backupReminder', DEFAULT_REMINDER) as BackupReminderConfig,
    };
  }

  setAutoBackupConfig(payload: { autoBackup?: Partial<AutoBackupConfig>; backupReminder?: Partial<BackupReminderConfig> }) {
    const store = new Store();
    if (payload.autoBackup) {
      const current = store.get('autoBackup', DEFAULT_AUTO_BACKUP) as AutoBackupConfig;
      store.set('autoBackup', { ...current, ...payload.autoBackup });
    }
    if (payload.backupReminder) {
      const current = store.get('backupReminder', DEFAULT_REMINDER) as BackupReminderConfig;
      store.set('backupReminder', { ...current, ...payload.backupReminder });
    }
  }
}

export const backupService = new BackupService();
