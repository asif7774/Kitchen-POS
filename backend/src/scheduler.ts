import { getDB } from './db';
import { BrowserWindow } from 'electron';
import { performAutoBackup, shouldFireReminder, markReminderFired } from './ipc/backup';

export function startScheduler() {
  // Menu schedule check — every minute
  setInterval(() => {
    checkMenuSchedules();
  }, 60000);
  setTimeout(checkMenuSchedules, 5000);

  // Backup reminder + auto-backup check — every minute
  setInterval(() => {
    checkAutoBackupAndReminder();
  }, 60000);
  setTimeout(checkAutoBackupAndReminder, 10000);
}

function checkMenuSchedules() {
  try {
    const db = getDB();
    const menus = db.prepare('SELECT * FROM menus WHERE schedule_enabled = 1').all() as Array<{
      id: number;
      name: string;
      auto_enable_time: string | null;
      auto_disable_time: string | null;
      is_active: number;
    }>;

    if (menus.length === 0) { return; }

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    for (const menu of menus) {
      if (!menu.auto_enable_time || !menu.auto_disable_time) { continue; }

      const enableParts = menu.auto_enable_time.split(':');
      const disableParts = menu.auto_disable_time.split(':');
      const enableH = parseInt(enableParts[0], 10);
      const enableM = parseInt(enableParts[1], 10);
      const disableH = parseInt(disableParts[0], 10);
      const disableM = parseInt(disableParts[1], 10);

      const enableTimeMinutes = enableH * 60 + enableM;
      const disableTimeMinutes = disableH * 60 + disableM;

      let shouldBeActive = false;

      if (enableTimeMinutes < disableTimeMinutes) {
        shouldBeActive = currentTimeMinutes >= enableTimeMinutes && currentTimeMinutes < disableTimeMinutes;
      } else {
        shouldBeActive = currentTimeMinutes >= enableTimeMinutes || currentTimeMinutes < disableTimeMinutes;
      }

      const isCurrentlyActive = menu.is_active === 1;

      if (shouldBeActive && !isCurrentlyActive) {
        db.prepare('UPDATE menus SET is_active = 1 WHERE id = ?').run(menu.id);
        notifyFrontend(menu.id, menu.name, 'enabled');
      } else if (!shouldBeActive && isCurrentlyActive) {
        db.prepare('UPDATE menus SET is_active = 0 WHERE id = ?').run(menu.id);
        notifyFrontend(menu.id, menu.name, 'disabled');
      }
    }
  } catch (error) {
    console.error('Error in checkMenuSchedules:', error);
  }
}

function notifyFrontend(menuId: number, menuName: string, action: 'enabled' | 'disabled') {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    win.webContents.send('menu:scheduleTriggered', { menuId, menuName, action });
  }
}

function checkAutoBackupAndReminder(): void {
  // Backup reminder
  if (shouldFireReminder()) {
    markReminderFired();
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send('backup:reminderDue');
    }
  }

  // Auto-backup runs at midnight (00:00)
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    void performAutoBackup();
  }
}
