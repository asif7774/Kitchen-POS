import { getDB } from './db';
import { BrowserWindow } from 'electron';

export function startScheduler() {
  // Run every minute
  setInterval(() => {
    checkMenuSchedules();
  }, 60000);
  
  // Also check immediately on startup
  setTimeout(checkMenuSchedules, 5000);
}

function checkMenuSchedules() {
  try {
    const db = getDB();
    const menus = db.prepare('SELECT * FROM menus WHERE schedule_enabled = 1').all() as any[];
    
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
        // e.g. 09:00 to 17:00
        shouldBeActive = currentTimeMinutes >= enableTimeMinutes && currentTimeMinutes < disableTimeMinutes;
      } else {
        // e.g. 23:00 to 06:00 (crosses midnight)
        shouldBeActive = currentTimeMinutes >= enableTimeMinutes || currentTimeMinutes < disableTimeMinutes;
      }

      const isCurrentlyActive = menu.is_active === 1;

      if (shouldBeActive && !isCurrentlyActive) {
        // Enable it
        db.prepare('UPDATE menus SET is_active = 1 WHERE id = ?').run(menu.id);
        notifyFrontend(menu.id, menu.name, 'enabled');
      } else if (!shouldBeActive && isCurrentlyActive) {
        // Disable it
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
