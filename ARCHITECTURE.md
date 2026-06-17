# Restaurant POS — Architecture & Specification

> Single terminal · Windows + macOS · Offline-first · GST-compliant (India)
> Frontend: Kitchen POS (React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4)

---

## 1. Project structure

```
Kitchen-Pos/
├── frontend/                  # React renderer process
│   ├── src/
│   │   ├── components/
│   │   │   ├── atoms/         # Base UI primitives (Button, Input, Badge, SvgSpriteLoader)
│   │   │   ├── molecules/     # Composed components (FormField, TableCard, MenuItemRow)
│   │   │   └── organisms/     # Complex sections (Header, Navigation, Global Modals)
│   │   ├── layouts/           # App shell, sidebar, header layouts
│   │   ├── pages/             # Route-level components — code-split per page by Vite
│   │   │   ├── Order/         # CRITICAL RULE: Each page must have its own folder
│   │   │   │   ├── components/# Page-specific local components (CartPanel, MenuPanel)
│   │   │   │   └── index.tsx  # Main page entry
│   │   ├── contexts/          # React context providers
│   │   ├── modules/           # Feature logic (co-located hooks + helpers per domain)
│   │   │   ├── orders/
│   │   │   ├── tables/
│   │   │   ├── menu/
│   │   │   ├── inventory/
│   │   │   ├── staff/
│   │   │   ├── reports/
│   │   │   ├── billing/
│   │   │   └── settings/
│   │   ├── store/             # Zustand global state slices
│   │   ├── lib/               # ipc-client.ts, formatters, tax-calc
│   │   └── main.tsx
│   ├── icons/                 # SVG source files — feed into generate-sprite script
│   ├── public/                # favicon.svg, manifest.webmanifest, sprite.svg output
│   ├── scripts/               # generate-svg-sprite.js
│   ├── index.html
│   ├── vite.config.ts         # Port 5200 · Terser · manual chunk split
│   ├── tailwind.config.js     # Tailwind CSS 4 CSS-first config
│   ├── vitest.config.ts
│   └── package.json
│
├── backend/                   # Electron main process (Node.js)
│   ├── src/
│   │   ├── main.ts            # App entry, BrowserWindow setup
│   │   ├── preload.ts         # contextBridge API surface
│   │   ├── ipc/               # IPC handler modules
│   │   │   ├── orders.ts
│   │   │   ├── menu.ts
│   │   │   ├── tables.ts
│   │   │   ├── inventory.ts
│   │   │   ├── staff.ts
│   │   │   ├── reports.ts
│   │   │   ├── billing.ts
│   │   │   ├── printer.ts
│   │   │   └── backup.ts
│   │   ├── db/
│   │   │   ├── index.ts       # DB connection singleton
│   │   │   ├── migrate.ts     # Run migrations on startup
│   │   │   └── migrations/    # 001_init.sql, 002_seed.sql ...
│   │   └── services/
│   │       ├── printer.ts     # escpos-usb wrapper
│   │       ├── backup.ts      # export/import logic
│   │       └── gst.ts         # Tax calculation helpers
│   └── tsconfig.json
│
├── assets/                    # icon.ico, icon.icns, icon.png
├── .vscode/                   # launch.json, settings.json, extensions.json
├── electron-builder.yml
├── package.json               # Root — workspaces: [frontend, backend]
└── ARCHITECTURE.md
```

---

## 2. Tech stack

| Layer | Technology | Version | Reason |
|---|---|---|---|
| Desktop shell | Electron | 30+ | Cross-platform Node access |
| UI framework | React (Vital boilerplate) | 19.2.7 | Latest concurrent features |
| Language | TypeScript | 6.0.3 | Strict typing throughout |
| Build tool | Vite | 8.0.16 | Fast HMR, code splitting |
| Styling | Tailwind CSS 4 | 4.3.1 | CSS-first config, utility classes |
| Component system | Atomic Design (atoms/molecules/organisms) | — | From Vital boilerplate |
| Routing | React Router | 7.17.0 | Page-level code splitting |
| State | Zustand | — | Minimal, no boilerplate |
| Database | SQLite via `better-sqlite3` | — | Embedded, single file, WAL mode |
| DB migrations | Custom SQL file runner | — | Full control, no ORM overhead |
| IPC | Electron contextBridge | — | Renderer never touches Node |
| Printing | `escpos` + `escpos-usb` | — | Direct USB ESC/POS |
| Settings | `electron-store` | — | Persists config outside DB |
| Backup | `fs` + raw `.sqlite` copy | — | Full fidelity, zero serialization |
| Auto-update | `electron-updater` | — | GitHub Releases |
| Packaging | `electron-builder` | — | NSIS (Win) + DMG (mac) |
| Testing | Vitest | 4.1.8 | From Vital boilerplate |
| Linting | ESLint 10 + Prettier 3.8 | — | From Vital boilerplate |
| Git hooks | Husky + lint-staged | — | From Vital boilerplate |
| SVG icons | SVG sprite system | — | From Vital boilerplate |

---

## 3. Security model

```
Renderer (React)
    │
    │  window.api  (contextBridge whitelist — preload.ts)
    ▼
Preload script
    │
    │  ipcRenderer.invoke('channel', payload)
    ▼
Main process (Node.js)  ──►  SQLite (better-sqlite3)
                         ──►  USB printer (escpos-usb)
                         ──►  File system (fs)
                         ──►  electron-store (settings)
```

- `contextIsolation: true` — mandatory, non-negotiable
- `nodeIntegration: false` — mandatory, non-negotiable
- Renderer has zero direct Node/fs access
- Every IPC handler validates and sanitises input before touching the DB

---

## 4. Vite configuration notes

The Vital boilerplate `vite.config.ts` has deliberate chunk splitting that carries over into this project:

- **Dev port:** `5200` (not 5173)
- **Manual chunks:** vendor-react, vendor-router, layouts, organisms, contexts, SVG sprite — each page gets its own chunk
- **Minifier:** Terser with `drop_console: true` in production
- **Path aliases:** `tsconfigPaths: true` — use `@/` imports in all frontend code
- **Module preload:** Only vendor + entry chunks are preloaded; page chunks load on demand
- **CSS:** Split per chunk, minified, `esnext` target

**Do not restructure `vite.config.ts`** without understanding the chunk budget. Breaking manual chunks will merge organism and vendor code and bloat the initial load.

---

## 5. Atomic Design conventions

Components live in `frontend/src/components/` organised by complexity:

| Level | Folder | Examples |
|---|---|---|
| Atoms | `atoms/` | Button, Input, Badge, SvgSpriteLoader, Spinner |
| Molecules | `molecules/` | FormField, TableStatusCard, MenuItemRow, SearchBar |
| Organisms | `organisms/` | Header, Navigation, Global Modals |
| Layouts | `layouts/` | AppShell, Sidebar, Header |
| Pages | `pages/` | `Tables/index.tsx`, `Order/index.tsx`, `Reports/index.tsx` |

**CRITICAL RULE FOR PAGES:** Every module/page MUST be placed in its own dedicated directory inside `src/pages/` (e.g., `src/pages/Order/`). Each page folder MUST contain a `components/` subfolder where all page-specific components are stored. Never clutter the global `src/components/` folder with components that are only used in a single page.

Feature-specific logic (hooks, helpers, types) lives co-located in `src/modules/<domain>/` — not inside `components/`. Components are pure UI; modules own business logic.

---

## 6. SVG sprite system

SVG icons use the optimised sprite system from Vital:

1. Add source `.svg` files to `frontend/icons/`
2. Run `npm run generate-sprite` — outputs `public/sprite.svg`
3. Use the `<SvgSpriteLoader />` atom in components:

```tsx
<SvgSpriteLoader id="icon-table" className="w-5 h-5" />
```

Never import SVGs directly as React components — this bypasses the sprite cache and inflates bundle size.

---

## 7. Database schema

### 7.1 Core tables

```sql
CREATE TABLE staff (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  pin        TEXT NOT NULL,       -- 4-digit PIN stored as bcrypt hash
  role       TEXT CHECK(role IN ('admin','manager','cashier','waiter')),
  is_active  INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active  INTEGER DEFAULT 1
);

CREATE TABLE menu_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id  INTEGER REFERENCES categories(id),
  name         TEXT NOT NULL,
  price        REAL NOT NULL,
  cgst_rate    REAL DEFAULT 0,    -- percent, e.g. 9.0
  sgst_rate    REAL DEFAULT 0,    -- percent, e.g. 9.0
  hsn_code     TEXT,              -- required for GST
  is_veg       INTEGER DEFAULT 1, -- 1=veg, 0=non-veg
  is_available INTEGER DEFAULT 1,
  sort_order   INTEGER DEFAULT 0
);

CREATE TABLE tables (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL,         -- "T1", "Outdoor 3"
  capacity INTEGER DEFAULT 4,
  section  TEXT DEFAULT 'Main'
);

CREATE TABLE orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id   INTEGER REFERENCES tables(id),
  staff_id   INTEGER REFERENCES staff(id),
  status     TEXT CHECK(status IN ('open','kot_sent','billed','cancelled')) DEFAULT 'open',
  covers     INTEGER DEFAULT 1,
  note       TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CRITICAL: snapshot price and tax rates at order time, never live-lookup
CREATE TABLE order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER REFERENCES orders(id),
  menu_item_id INTEGER REFERENCES menu_items(id),
  name         TEXT NOT NULL,     -- snapshot
  qty          INTEGER NOT NULL,
  unit_price   REAL NOT NULL,     -- snapshot
  cgst_rate    REAL NOT NULL,     -- snapshot
  sgst_rate    REAL NOT NULL,     -- snapshot
  hsn_code     TEXT,              -- snapshot
  discount     REAL DEFAULT 0,
  kot_printed  INTEGER DEFAULT 0,
  note         TEXT
);

CREATE TABLE payments (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id  INTEGER REFERENCES orders(id),
  method    TEXT CHECK(method IN ('cash','card','upi','complimentary')),
  amount    REAL NOT NULL,
  reference TEXT,                 -- UPI txn ID or card last 4
  paid_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bills (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_number     TEXT NOT NULL UNIQUE,   -- "INV-2024-0001"
  order_id        INTEGER REFERENCES orders(id),
  taxable_amount  REAL NOT NULL,
  cgst_amount     REAL NOT NULL,
  sgst_amount     REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  total_amount    REAL NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_items (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT NOT NULL,
  unit               TEXT NOT NULL,      -- "kg", "litre", "piece"
  qty_in_stock       REAL DEFAULT 0,
  low_stock_alert_at REAL DEFAULT 0,
  cost_per_unit      REAL DEFAULT 0
);

CREATE TABLE menu_inventory_map (
  menu_item_id      INTEGER REFERENCES menu_items(id),
  inventory_item_id INTEGER REFERENCES inventory_items(id),
  qty_used          REAL NOT NULL
);

CREATE TABLE inventory_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id    INTEGER REFERENCES inventory_items(id),
  type       TEXT CHECK(type IN ('purchase','sale','adjustment','wastage')),
  qty_change REAL NOT NULL,
  note       TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shifts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id     INTEGER REFERENCES staff(id),
  opened_at    DATETIME,
  closed_at    DATETIME,
  opening_cash REAL DEFAULT 0,
  closing_cash REAL DEFAULT 0,
  note         TEXT
);
```

### 7.2 Bill number sequencing

Store `last_bill_number` in `electron-store` — not SQLite. Increment inside the DB transaction that creates the bill. If the transaction rolls back, do NOT persist the increment.

```ts
// backend/services/billing.ts
function getNextBillNumber(): string {
  const store = getStore()
  const n = store.get('last_bill_number', 0) as number
  const next = n + 1
  const year = new Date().getFullYear()
  store.set('last_bill_number', next)
  return `INV-${year}-${String(next).padStart(4, '0')}`
}
```

---

## 8. IPC channel reference

All channels follow `module:action` naming. Every handler returns `{ success: boolean, data?: any, error?: string }`.

| Channel | Payload | Returns |
|---|---|---|
| `orders:create` | `{ table_id, staff_id, covers }` | order |
| `orders:addItem` | `{ order_id, menu_item_id, qty, note }` | order_item |
| `orders:updateItem` | `{ item_id, qty, note }` | order_item |
| `orders:removeItem` | `{ item_id }` | ok |
| `orders:getOpen` | — | order[] |
| `orders:getByTable` | `{ table_id }` | order |
| `print:kot` | `{ order_id }` | ok |
| `billing:createBill` | `{ order_id, payments[], discount }` | bill |
| `print:bill` | `{ bill_id }` | ok |
| `menu:getAll` | — | category[] with items |
| `menu:upsertItem` | menu_item payload | menu_item |
| `menu:toggleAvailable` | `{ id, is_available }` | ok |
| `tables:getAll` | — | table[] with status |
| `inventory:getAll` | — | inventory_item[] |
| `inventory:adjust` | `{ item_id, qty, type, note }` | ok |
| `staff:login` | `{ pin }` | staff or null |
| `staff:getAll` | — | staff[] |
| `reports:daily` | `{ date }` | report summary |
| `reports:gst` | `{ from, to }` | gst report |
| `backup:export` | `{ path }` | ok |
| `backup:import` | `{ path }` | ok |
| `settings:get` | — | settings object |
| `settings:save` | settings payload | ok |

---

## 9. GST tax calculation

```ts
// backend/services/gst.ts

export function calcLineItemTax(
  unitPrice: number,
  qty: number,
  cgstRate: number,
  sgstRate: number,
  discount: number = 0
) {
  const grossAmount = unitPrice * qty
  const discountedAmount = grossAmount - discount
  const taxableAmount = discountedAmount / (1 + (cgstRate + sgstRate) / 100)
  const cgstAmount = taxableAmount * (cgstRate / 100)
  const sgstAmount = taxableAmount * (sgstRate / 100)
  return {
    taxableAmount: round2(taxableAmount),
    cgstAmount:    round2(cgstAmount),
    sgstAmount:    round2(sgstAmount),
    totalAmount:   round2(discountedAmount)
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
```

Bill receipt must print (per GST rules): restaurant name, GSTIN, address, sequential bill number, date + time, HSN code per line, taxable amount, CGST % + amount, SGST % + amount, grand total.

---

## 10. Thermal printer (ESC/POS)

```ts
// backend/services/printer.ts
import escpos from 'escpos'
import USB from 'escpos-usb'

export async function printKOT(
  items: KOTItem[],
  tableName: string,
  orderNote: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const device = new USB()
      const printer = new escpos.Printer(device)
      device.open(() => {
        printer
          .align('CT').style('B').size(1, 1).text('KITCHEN ORDER')
          .style('NORMAL').size(0, 0)
          .text(`Table: ${tableName}`)
          .text(`Time: ${new Date().toLocaleTimeString('en-IN')}`)
          .drawLine()
        items.forEach(item => {
          printer.text(`${item.qty}x  ${item.name}`)
          if (item.note) printer.text(`    ** ${item.note}`)
        })
        if (orderNote) printer.drawLine().text(`NOTE: ${orderNote}`)
        printer.drawLine().cut().close(() => resolve())
      })
    } catch (err) {
      reject(err)
    }
  })
}
```

**Always wrap printer calls in try/catch and return the error to the renderer.** Show "Printer error — retry?" in the UI. Never silently swallow printer failures.

---

## 11. Backup and restore

```ts
// backend/services/backup.ts
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { getDB } from '../db'

export function exportBackup(destPath: string): void {
  const db = getDB()
  db.pragma('wal_checkpoint(TRUNCATE)')           // flush WAL before copy
  const dbPath = path.join(app.getPath('userData'), 'pos.db')
  fs.copyFileSync(dbPath, destPath)
}

export function importBackup(srcPath: string): void {
  const db = getDB()
  db.close()
  const dbPath = path.join(app.getPath('userData'), 'pos.db')
  fs.copyFileSync(dbPath, dbPath + '.bak')        // rollback copy
  try {
    fs.copyFileSync(srcPath, dbPath)
  } catch (err) {
    fs.copyFileSync(dbPath + '.bak', dbPath)       // restore on failure
    throw err
  }
}
```

---

## 12. Module build order

Build in this sequence — each step is independently usable before the next begins.

```
1. Settings         → outlet name, GSTIN, address, tax defaults, printer test
2. Menu management  → categories, items, HSN codes, tax rates, veg flag
3. Table management → floor plan grid, sections, status colours
4. Orders + KOT     → create order, add items, send KOT to printer  ← CORE
5. Billing          → GST bill, payment (cash/card/UPI/split), receipt print
6. Inventory        → stock levels, auto-deduct on bill, low-stock alerts
7. Staff / shifts   → PIN login, role-based access, shift open/close
8. Reports          → daily summary, GST report, CSV/Excel export
9. Backup / restore → export .sqlite, import, end-of-day reminder
```

---

## 13. UI/UX conventions

- **Tailwind CSS 4** via `frontend/tailwind.config.js` — CSS-first config. Use existing utility and component classes from Vital (`.btn-primary`, `.card`, `.container-responsive`, `.hover-lift`, `.focus-ring`)
- **Colour system:** Table status — green=available, amber=occupied, red=bill-requested
- **Touch-friendly:** All tap targets ≥ 44px — staff may use a touchscreen terminal
- **PIN login:** Full-screen numpad on app launch, role stored in Zustand `auth` slice
- **KOT flow:** Order screen → "Send to Kitchen" → prints KOT → order status turns `kot_sent`
- **Bill flow:** Occupied table → "Generate Bill" → payment modal → receipt prints → table clears to available
- **Keyboard shortcuts:** `F1` = New Order, `F2` = Tables, `F4` = Menu, `F10` = Reports, `Esc` = close modal

---

## 14. Packaging

```yaml
# electron-builder.yml
appId: com.yourname.restaurantpos
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
  owner: YOUR_GITHUB_USERNAME
  repo: restaurant-pos
```

---

## 15. Known risks and mitigations

| Risk | Mitigation |
|---|---|
| Printer disconnects mid-print | try/catch on every print call, retry dialog in UI |
| Bill number gap on crash | Counter in electron-store, rollback on DB tx failure |
| DB corruption on power loss | WAL mode enabled on connection + nightly backup prompt |
| Staff PIN brute force | Lock account for 60s after 3 wrong attempts |
| Wrong GST on old bills | Snapshot rates on order_items at creation time |
| Import overwrites live DB | Keep `.sqlite.bak`, confirm dialog before import |
| Two staff editing same order | Reload order before every mutation, show stale-data warning |
| Vite chunk budget exceeded | Keep organisms in `components-organisms` chunk; don't import them in atoms |
