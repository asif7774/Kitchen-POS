import { app, BrowserWindow, Menu, Tray, protocol, net } from 'electron';
import * as path from 'path';
import { runMigrations } from './db/migrate';
import { getDB } from './db';
import { startScheduler } from './scheduler';
import { registerOrdersIPC } from './ipc/orders';
import { registerMenuIPC } from './ipc/menu';
import { registerTablesIPC } from './ipc/tables';
import { registerBillingIPC } from './ipc/billing';
import { registerInventoryIPC } from './ipc/inventory';
import { registerStaffIPC } from './ipc/staff';
import { registerReportsIPC } from './ipc/reports';
import { registerBackupIPC } from './ipc/backup';
import { registerSettingsIPC } from './ipc/settings';
import { registerPrinterIPC } from './ipc/printer';
import { registerKDSIPC } from './ipc/kds';
import { registerShiftsIPC } from './ipc/shifts';
import { registerExpensesIPC } from './ipc/expenses';
import { registerCustomersIPC } from './ipc/customers';
import { registerDashboardIPC } from './ipc/dashboard';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  if (isDev) {
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
    void mainWindow.loadURL('http://localhost:5205');
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../../../assets/icon.png'); // Example icon path, make sure it exists or update logic
  // For now using a native image or resolving later is fine, but here is standard setup.
  // Using an empty NativeImage for robust execution
  void import('electron').then(({ nativeImage }) => {
     let trayIcon = nativeImage.createEmpty();
     try {
       trayIcon = nativeImage.createFromPath(iconPath);
     } catch (_e) { /* Ignore invalid icon paths */ }

    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open', click: () => {
          if (mainWindow) {
             if (mainWindow.isMinimized()) {mainWindow.restore();}
             mainWindow.focus();
          } else {
             void createWindow();
          }
      }},
      { label: 'Quit', click: () => {
          app.quit();
      }}
    ]);
    tray.setToolTip('Restaurant POS');
    tray.setContextMenu(contextMenu);
  });
}

function registerAllIPC() {
  registerOrdersIPC();
  registerMenuIPC();
  registerTablesIPC();
  registerBillingIPC();
  registerInventoryIPC();
  registerStaffIPC();
  registerReportsIPC();
  registerBackupIPC();
  registerSettingsIPC();
  registerPrinterIPC();
  registerKDSIPC();
  registerShiftsIPC();
  registerExpensesIPC();
  registerCustomersIPC();
  registerDashboardIPC();
}

void app.whenReady().then(async () => {
  // Register custom protocol for local images
  protocol.handle('local', (request) => {
    return net.fetch('file://' + request.url.slice('local://'.length));
  });

  // Initialize DB and Run migrations before registering IPC
  getDB();
  runMigrations();

  registerAllIPC();
  startScheduler();

  void createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
