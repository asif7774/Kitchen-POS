# Restaurant POS — AI Coding Assistant Prompt

> Paste the prompt block below into **Claude Code**, **Cursor**, or **GitHub Copilot Chat**.
> Run it from your project root — the folder that contains `/frontend` (Vital boilerplate) and `/backend` (empty).

---

## Prompt to paste

```
You are a senior Electron + React architect. I am building a restaurant POS application.

My project root contains:
- /frontend  — the Vital boilerplate (React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4 + Atomic Design)
              DO NOT reinitialise or modify its config files (vite.config.ts, tailwind.config.js,
              tsconfig files, eslint.config.js, vitest.config.ts). It already works.
- /backend   — an empty folder for the Electron main process

Read the full context below, then scaffold the project exactly as specified.
Do not skip steps. Do not add dependencies not listed here. Confirm each filename after creation.

---

## IMPORTANT: Vital boilerplate constraints

The frontend is based on https://github.com/asif7774/vital. Key facts you must respect:

- Dev server runs on port 5200 (not 5173)
- Path aliases are configured via tsconfigPaths — use @/ for src/
- SVG icons use a sprite system: source files go in icons/, run `npm run generate-sprite`,
  then use <SvgSpriteLoader /> atom. NEVER import SVGs as React components.
- Component structure follows Atomic Design:
    atoms/       Base primitives (Button, Input, Badge, SvgSpriteLoader)
    molecules/   Composed UI (FormField, TableStatusCard, MenuItemRow)
    organisms/   Complex sections (OrderPanel, BillModal, FloorPlanGrid)
    layouts/     App shell, sidebar, header
    pages/       Route-level views (code-split per page by Vite)
- Use existing Tailwind utility/component classes: .btn-primary, .card, .container-responsive,
  .hover-lift, .focus-ring, .animate-fade-in
- All new feature logic goes in src/modules/<domain>/ — NOT inside components/
- Vitest is already configured — add tests in *.test.tsx files next to components

---

## Security rules (non-negotiable)

- contextIsolation: true
- nodeIntegration: false
- All Node/DB access through IPC only via window.api
- Renderer never imports Node, fs, path, or better-sqlite3

---

## Step 1 — Backend scaffolding

### /backend/package.json
```json
{
  "name": "pos-backend",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "electron-store": "^8.1.0",
    "escpos": "^3.0.0-alpha.6",
    "escpos-usb": "^3.0.0-alpha.4",
    "archiver": "^6.0.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0"
  }
}
```

### /backend/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### /backend/src/main.ts
Electron entry point. Must:
- Create BrowserWindow with contextIsolation: true, nodeIntegration: false, preload: path to preload.ts
- In dev load http://localhost:5200 (Vital's port); in prod load frontend/dist/index.html
- Import and register all IPC handlers from /backend/src/ipc/
- Call db/migrate.ts on startup before registering IPC
- Add system tray with "Open" and "Quit" menu items

### /backend/src/preload.ts
Expose window.api via contextBridge with these typed methods:
- orders: { create, addItem, updateItem, removeItem, getOpen, getByTable }
- menu: { getAll, upsertItem, deleteItem, toggleAvailable }
- tables: { getAll, upsert, delete }
- billing: { createBill, getBill }
- print: { kot, bill }
- inventory: { getAll, adjust, upsertItem }
- staff: { login, getAll, upsert }
- reports: { daily, gst }
- backup: { export, import }
- settings: { get, save }
Each method maps to ipcRenderer.invoke('module:action', payload).

### /backend/src/db/index.ts
SQLite singleton using better-sqlite3.
- File path: app.getPath('userData') + '/pos.db'
- Enable WAL mode: db.pragma('journal_mode = WAL')
- Export getDB() returning the singleton

### /backend/src/db/migrate.ts
Migration runner:
- Creates _migrations table if not exists
- Reads all .sql files from /backend/src/db/migrations/ alphabetically
- Skips already-applied migrations (tracked by filename in _migrations)
- Applies new ones in order using db.exec()

### /backend/src/db/migrations/001_init.sql
```sql
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin','manager','cashier','waiter')) DEFAULT 'waiter',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id),
  name TEXT NOT NULL,
  price REAL NOT NULL,
  cgst_rate REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  hsn_code TEXT,
  is_veg INTEGER DEFAULT 1,
  is_available INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 4,
  section TEXT DEFAULT 'Main'
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id INTEGER REFERENCES tables(id),
  staff_id INTEGER REFERENCES staff(id),
  status TEXT CHECK(status IN ('open','kot_sent','billed','cancelled')) DEFAULT 'open',
  covers INTEGER DEFAULT 1,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id),
  menu_item_id INTEGER REFERENCES menu_items(id),
  name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  cgst_rate REAL NOT NULL,
  sgst_rate REAL NOT NULL,
  hsn_code TEXT,
  discount REAL DEFAULT 0,
  kot_printed INTEGER DEFAULT 0,
  note TEXT
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id),
  method TEXT CHECK(method IN ('cash','card','upi','complimentary')),
  amount REAL NOT NULL,
  reference TEXT,
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_number TEXT NOT NULL UNIQUE,
  order_id INTEGER REFERENCES orders(id),
  taxable_amount REAL NOT NULL,
  cgst_amount REAL NOT NULL,
  sgst_amount REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  qty_in_stock REAL DEFAULT 0,
  low_stock_alert_at REAL DEFAULT 0,
  cost_per_unit REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS menu_inventory_map (
  menu_item_id INTEGER REFERENCES menu_items(id),
  inventory_item_id INTEGER REFERENCES inventory_items(id),
  qty_used REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS inventory_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER REFERENCES inventory_items(id),
  type TEXT CHECK(type IN ('purchase','sale','adjustment','wastage')),
  qty_change REAL NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER REFERENCES staff(id),
  opened_at DATETIME,
  closed_at DATETIME,
  opening_cash REAL DEFAULT 0,
  closing_cash REAL DEFAULT 0,
  note TEXT
);
```

### /backend/src/db/migrations/002_seed.sql
Insert:
- 4 categories: Starters, Main Course, Beverages, Desserts
- 12 menu items across those categories with realistic Indian restaurant prices and GST rates
  (use 5% GST = 2.5+2.5 CGST+SGST for food; 18% = 9+9 for alcoholic beverages)
- 10 tables named T1 through T10
- 1 admin staff: name='Admin', pin='$2b$10$PLACEHOLDER', role='admin'
  (add a SQL comment: -- DEFAULT PIN IS 1234 — CHANGE IMMEDIATELY)
Use INSERT OR IGNORE to make seed idempotent.

### /backend/src/services/gst.ts
Export:
- calcLineItemTax(unitPrice, qty, cgstRate, sgstRate, discount?) → { taxableAmount, cgstAmount, sgstAmount, totalAmount } all rounded to 2dp
- calcBillTotals(items: OrderItem[]) → bill-level aggregates

### /backend/src/services/billing.ts
Export:
- getNextBillNumber() — reads electron-store key 'last_bill_number' (default 0), increments, returns 'INV-YYYY-XXXX'
- createBill(orderId, payments, discount) — single DB transaction: calc totals, get bill number, insert bill, insert payments, set order status='billed'. Roll back bill number if transaction fails.

### /backend/src/services/printer.ts
Export:
- printKOT(items, tableName, orderNote) — ESC/POS USB print. Wrap in try/catch, return Promise<void>, throw on error.
- printBill(bill, orderItems, settings) — Full GST receipt. Include: outlet name + GSTIN centred, bill number + date, each line with qty/name/HSN/price, CGST/SGST breakdown, total, payment methods, "Thank you!". Throw on error.

### /backend/src/ipc/orders.ts, menu.ts, tables.ts, billing.ts, inventory.ts, staff.ts, reports.ts, backup.ts, settings.ts, printer.ts
One file per domain. Each registers ipcMain.handle('domain:action', handler) calls.
- Input validation on every handler before touching DB
- Return { success: true, data } on success
- Return { success: false, error: string } on failure — never throw unhandled

---

## Step 2 — Frontend scaffolding

Work inside /frontend/src — DO NOT touch config files.

### /frontend/src/lib/ipc.ts
Typed wrapper re-exporting all window.api methods with proper TypeScript types.
Export a single `api` object. Types must match the IPC channel payloads exactly.

### /frontend/src/store/auth.ts
Zustand slice:
- state: { staff: Staff | null, isAuthenticated: boolean }
- login(pin: string) → calls api.staff.login, sets staff on success
- logout() → clears staff

### /frontend/src/store/order.ts
Zustand slice:
- state: { activeOrders: Order[], selectedTableId: number | null }
- fetchOpenOrders(), selectTable(id), addItem(...), removeItem(...), sendKOT(orderId), generateBill(...)

### /frontend/src/App.tsx
React Router v7 routes:
- /login → LoginPage (full-screen PIN numpad — not a form, uses onClick handlers)
- /tables → TablesPage (default after login)
- /order/:tableId → OrderPage
- /menu → MenuPage (admin/manager only)
- /inventory → InventoryPage
- /staff → StaffPage (admin only)
- /reports → ReportsPage
- /settings → SettingsPage
Protect all routes: redirect to /login if not authenticated.

### /frontend/src/pages/LoginPage.tsx
Full-screen PIN entry. Numpad with digits 0-9, backspace, submit.
Use onClick, not a <form>. On submit call api.staff.login — success routes to /tables.
Show "Incorrect PIN" shake animation on failure.
Use .btn-primary and .card Tailwind classes from Vital.

### /frontend/src/pages/TablesPage.tsx
Grid layout using Vital's .container-responsive.
Fetch tables on mount. Each table is a molecule TableStatusCard.
Status colours: green=available, amber=occupied, red=bill_requested.
Click routes to /order/:tableId.

### /frontend/src/components/molecules/TableStatusCard.tsx
Card showing table name, status badge, covers count.
Uses .card and .hover-lift from Vital.
Badge uses colour classes for status.

### /frontend/src/pages/OrderPage.tsx
Two-panel layout:
- Left: menu categories + items, search bar (use atom Input), tap to add
- Right: current order items with +/- qty controls (use atom Button), item note, subtotal
Bottom bar: "Send to Kitchen" (calls api.print.kot + api.orders.update) and "Generate Bill" buttons.
Use Vital's .btn-primary for primary actions.

### /frontend/src/components/organisms/BillModal.tsx
Modal (use Vital's accessible Modal component if available, else React Portal):
- Itemised list with GST breakdown per line
- Discount input
- Payment method tabs: Cash / Card / UPI / Complimentary — supports split payment
- Validate total payments = bill total before enabling Print button
- On confirm: call api.billing.createBill then api.print.bill

### /frontend/src/pages/ReportsPage.tsx
Date picker + metric summary cards:
- Total orders, revenue, CGST collected, SGST collected, total GST
- Payment method breakdown
- Top 10 items by qty
- Recharts BarChart for hourly order distribution
(Install recharts in frontend if not present)

### /frontend/src/pages/SettingsPage.tsx
Sections:
- Outlet: name, address, GSTIN, FSSAI number
- Tax defaults: default CGST, default SGST
- Printer: "Test Print" button
- Backup: "Export Backup" (save dialog), "Import Backup" (file picker + warning)
- Danger zone: "Reset Bill Counter" (admin only)
All saves call api.settings.save. No <form> tags — use onClick handlers.

---

## Step 3 — Root package.json

```json
{
  "name": "restaurant-pos",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\" \"wait-on http://localhost:5200 && electron backend/dist/main.js\"",
    "build": "npm run build --prefix backend && npm run build --prefix frontend",
    "package": "npm run build && electron-builder"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "electron": "^30.0.0",
    "electron-builder": "^24.9.1",
    "wait-on": "^7.2.0"
  }
}
```

---

## Step 4 — electron-builder.yml (project root)

```yaml
appId: com.restaurantpos.app
productName: Restaurant POS
directories:
  output: dist-electron
files:
  - backend/dist/**/*
  - frontend/dist/**/*
extraResources:
  - from: backend/src/db/migrations
    to: migrations
win:
  target: nsis
  icon: assets/icon.ico
mac:
  target: dmg
  icon: assets/icon.icns
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
publish:
  provider: github
  owner: REPLACE_WITH_GITHUB_USERNAME
  repo: restaurant-pos
```

---

## Step 5 — VSCode workspace config

### /.vscode/extensions.json
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "vitest.explorer"
  ]
}
```

### /.vscode/settings.json
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "frontend/node_modules/typescript/lib",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "tailwindCSS.experimental.configFile": "frontend/tailwind.config.js",
  "files.associations": { "*.sql": "sql" },
  "vitest.rootConfig": "frontend/vitest.config.ts"
}
```

### /.vscode/launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["backend/dist/main.js", "--inspect=5858"],
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "sourceMaps": true,
      "env": { "NODE_ENV": "development" }
    }
  ]
}
```

---

## Completion checklist

After scaffolding, confirm every file exists:

Backend:
- [ ] /backend/package.json
- [ ] /backend/tsconfig.json
- [ ] /backend/src/main.ts
- [ ] /backend/src/preload.ts
- [ ] /backend/src/db/index.ts
- [ ] /backend/src/db/migrate.ts
- [ ] /backend/src/db/migrations/001_init.sql
- [ ] /backend/src/db/migrations/002_seed.sql
- [ ] /backend/src/services/gst.ts
- [ ] /backend/src/services/billing.ts
- [ ] /backend/src/services/printer.ts
- [ ] /backend/src/ipc/orders.ts
- [ ] /backend/src/ipc/menu.ts
- [ ] /backend/src/ipc/tables.ts
- [ ] /backend/src/ipc/billing.ts
- [ ] /backend/src/ipc/inventory.ts
- [ ] /backend/src/ipc/staff.ts
- [ ] /backend/src/ipc/reports.ts
- [ ] /backend/src/ipc/backup.ts
- [ ] /backend/src/ipc/settings.ts
- [ ] /backend/src/ipc/printer.ts

Frontend:
- [ ] /frontend/src/lib/ipc.ts
- [ ] /frontend/src/store/auth.ts
- [ ] /frontend/src/store/order.ts
- [ ] /frontend/src/App.tsx
- [ ] /frontend/src/pages/LoginPage.tsx
- [ ] /frontend/src/pages/TablesPage.tsx
- [ ] /frontend/src/pages/OrderPage.tsx
- [ ] /frontend/src/pages/ReportsPage.tsx
- [ ] /frontend/src/pages/SettingsPage.tsx
- [ ] /frontend/src/components/molecules/TableStatusCard.tsx
- [ ] /frontend/src/components/organisms/BillModal.tsx

Root:
- [ ] /package.json
- [ ] /electron-builder.yml
- [ ] /.vscode/launch.json
- [ ] /.vscode/settings.json
- [ ] /.vscode/extensions.json

Then run:
  npm install
  npm install --prefix frontend
  npm install --prefix backend
  npm run build --prefix backend
  npm run dev
```

---

## How to use this file

1. Open VSCode at your project root (folder containing `/frontend` and `/backend`)
2. Open Claude Code (`claude` in terminal), Cursor Chat, or Copilot Chat
3. Paste the entire code block above
4. Let it scaffold — it will create files one by one and confirm each
5. After scaffolding, install dependencies and start dev as shown in the checklist

---

## Follow-up prompts per module

Use these after the initial scaffold is complete:

**Order flow (full implementation):**
> "Implement OrderPage.tsx fully. Left panel: menu grouped by category with an atom Input search bar filtering items in real time. Right panel: current order items with atom Button +/- controls, per-item note input, running subtotal. 'Send to Kitchen' calls api.print.kot and api.orders.updateItem to set kot_printed=true. 'Generate Bill' opens BillModal organism. Follow Vital's Atomic Design — all base elements must be atoms."

**Billing (full GST flow):**
> "Implement BillModal.tsx organism. Show itemised GST breakdown per line (taxable + CGST amount + SGST amount). Support split payment across Cash/Card/UPI with separate amount inputs. Validate that sum of payment amounts equals bill total before enabling the Print button. On confirm call api.billing.createBill followed by api.print.bill. Use Vital's accessible Modal component. No <form> tags."

**Reports:**
> "Implement ReportsPage.tsx. Add a date range picker (from/to). Fetch via api.reports.daily. Show metric cards for: total orders, total revenue, CGST collected, SGST collected. Add a Recharts BarChart for hourly order count. Add a 'Download CSV' button that exports all bills in the date range. Use Vital's .card and .container-responsive classes."

**Inventory:**
> "Implement the Inventory module (page + molecules). List all inventory items as rows with current stock. Highlight rows where qty_in_stock < low_stock_alert_at in amber using Vital's warning colour. Add a quick-adjust molecule modal (purchase/wastage/adjustment with note field). Show last 10 log entries per item in a collapsible row. Use Vital's .hover-lift and .focus-ring."
