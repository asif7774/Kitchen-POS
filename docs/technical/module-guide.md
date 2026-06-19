# Kitchen POS — Module Architecture Guide

A developer reference for understanding the codebase structure, navigating modules, and adding new features.

---

## Part 1: Architecture Overview

### Electron Two-Process Model

The app runs as two separate processes that communicate exclusively via IPC:

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  Renderer Process           │     │  Main Process               │
│  (frontend/)                │     │  (backend/)                 │
│                             │     │                             │
│  React 19 + Vite 8          │ IPC │  Node.js (Electron)         │
│  TypeScript                 │◄───►│  TypeScript                 │
│  Tailwind CSS 4             │     │  better-sqlite3             │
│  Zustand state              │     │  escpos-usb                 │
│  React Router 7             │     │  electron-store             │
│                             │     │  fs (backup)                │
│  window.api.*               │     │  ipcMain.handle(...)        │
└─────────────────────────────┘     └─────────────────────────────┘
```

The renderer has zero access to Node.js, the file system, or the database. All backend operations go through named IPC channels. The `preload.ts` script is the only bridge — it exposes a whitelisted `window.api` object using Electron's `contextBridge`.

### IPC Layer

Every backend capability is exposed as a named channel (`module:action`). The frontend calls them via a typed wrapper:

```ts
// frontend/src/lib/ipc.ts — typed wrapper around window.api
import { ipcRenderer } from 'electron'

export const ipc = {
  orders: {
    sendKOT: (payload) => window.api.invoke('orders:sendKOT', payload),
    getOpen: () => window.api.invoke('orders:getOpen'),
    // ...
  }
}
```

See `ipc-api-reference.md` for the full channel list.

### Component Architecture (Atomic Design)

```
frontend/src/components/
├── atoms/          # Primitives: Button, Input, Badge, SvgSpriteLoader, Spinner
├── molecules/      # Compositions: FormField, TableStatusCard, MenuItemRow, SearchBar
└── organisms/      # Complex sections: Header, Sidebar, global modals
```

**Rule:** Global components (`atoms/`, `molecules/`, `organisms/`) are for components used in more than one page. Components used in only one page live in that page's `components/` subfolder.

### State Management

Zustand is used for global client state. Slices live in `frontend/src/store/`:

| File | State owned |
|---|---|
| `auth.ts` | Logged-in staff member, role, login/logout actions |
| `order.ts` | Current order cart state (items, table, covers) |

For server state (data fetched from IPC), components fetch on mount and store locally — there is no global server cache layer.

### Context Providers

React contexts are used for cross-cutting UI concerns:

| Context | Purpose |
|---|---|
| `AuthContext.tsx` | Authentication state (wraps Zustand auth store for React tree) |
| `BusinessSessionContext.tsx` | Active business session state, open/close actions |
| `HeaderContext.tsx` | Dynamic header title and actions per page |
| `ModalContext.tsx` | Global modal open/close state |
| `ToastContext.tsx` | Toast notification queue |

Contexts live in `frontend/src/contexts/`. They are mounted in the app shell (`frontend/src/App.tsx` or `frontend/src/app/`).

---

## Part 2: Page Modules

Each page is a route-level component in `frontend/src/pages/<Module>/index.tsx` with its own `components/` subfolder for page-specific components.

---

### Login

**Route:** `/login` (shown before auth)
**Files:**
- `frontend/src/pages/Login/index.tsx` — full-screen PIN numpad

**Key behaviours:**
- Full-screen modal with 4-digit PIN entry
- On submit: calls `staff:login`; on success stores staff in Zustand auth slice
- On 3 failures: shows lockout message for 60 seconds
- No navigation until login succeeds

---

### Setup

**Route:** `/setup` (shown on first run before auth)
**Files:**
- `frontend/src/pages/Setup/index.tsx` — first-run wizard

**Key behaviours:**
- Checks `system:isSetupComplete` on app load
- Guides admin through: outlet name/GSTIN, first menu creation, first table setup
- Calls `system:completeSetup` when done; redirects to login

---

### Dashboard

**Route:** `/`
**Files:**
- `frontend/src/pages/Dashboard/index.tsx`
**IPC channels:** `dashboard:getMetrics`, `businessSession:getActive`, `businessSession:start`, `businessSession:close`

**Key behaviours:**
- Shows today's sales total, order count, open table count, low-stock alerts
- Business session open/close controls for admins
- Metrics refresh on page load and after session state changes

---

### Order (Order Taking)

**Route:** `/order`
**Files:**
- `frontend/src/pages/Order/index.tsx` — main order screen
- `frontend/src/pages/Order/components/MenuPanel.tsx` — menu browsing
- `frontend/src/pages/Order/components/CartPanel.tsx` — current order cart
- *(additional components in `components/`)*
**IPC channels:** `orders:sendKOT`, `orders:getOpen`, `menu:getAll`, `customers:search`

**Key behaviours:**
- Left panel: menu categories + items; right panel: current cart
- Selecting a table populates the cart with any existing open order
- "Send to Kitchen" calls `orders:sendKOT` — prints KOT and updates order status
- Cart state managed locally (Zustand `order` store) until submitted

---

### Tables

**Route:** `/tables`
**Files:**
- `frontend/src/pages/Tables/index.tsx` — floor plan grid
**IPC channels:** `tables:getAll`, `orders:getOpen`

**Key behaviours:**
- Grid of table cards coloured by status (green / amber / red)
- Tapping a table navigates to the Order screen with that table pre-selected
- Polling or on-focus refresh to keep status current

---

### Menu (Management)

**Route:** `/menu`
**Files:**
- `frontend/src/pages/Menu/index.tsx`
- `frontend/src/pages/Menu/components/MenuItemModal.tsx`
- *(other components in `components/`)*
**IPC channels:** `menu:getMenus`, `menu:getAll`, `menu:upsertMenu`, `menu:upsertCategory`, `menu:upsertItem`, `menu:deleteItem`, `menu:toggleAvailable`, `menu:uploadImage`, `menu:duplicateMenu`, `menu:getRecipe`, `menu:updateRecipe`

**Key behaviours:**
- Tab per menu; categories listed with their items
- Inline availability toggle per item (calls `menu:toggleAvailable`)
- Item modal: full edit form including image upload and inventory recipe mapping
- Category and menu CRUD in the same view

---

### KDS (Kitchen Display Screen)

**Route:** `/kds`
**Files:**
- `frontend/src/pages/KDS/index.tsx`
**IPC channels:** `kds:getActiveTickets`, `kds:updateItemStatus`, `kds:updateOrderStatus`

**Key behaviours:**
- Designed for a second display — no navigation sidebar shown in this view
- Cards per open order showing items and preparation status
- Staff tap items to advance status: pending → preparing → ready → served
- Polling for new tickets at a set interval

---

### Reports

**Route:** `/reports`
**Files:**
- `frontend/src/pages/Reports/index.tsx`
**IPC channels:** `reports:daily`, `reports:gst`, `reports:getPastOrders`

**Key behaviours:**
- Date-range picker for all reports
- Daily summary, GST breakdown, payment method breakdown, hourly chart tabs
- Data fetched on filter change; no caching

---

### Past Orders

**Route:** `/past-orders`
**Files:**
- `frontend/src/pages/PastOrders/index.tsx`
**IPC channels:** `reports:getPastOrders`, `reports:printPastBill`

**Key behaviours:**
- Paginated list of historical orders
- Date filter
- Expand row to see item list and payment details
- Reprint bill button calls `reports:printPastBill`

---

### Inventory

**Route:** `/inventory`
**Files:**
- `frontend/src/pages/Inventory/index.tsx`
**IPC channels:** `inventory:getAll`, `inventory:upsertItem`, `inventory:adjust`

**Key behaviours:**
- Item list with current stock levels
- Low-stock items highlighted
- Adjust modal: log purchase, adjustment, or wastage
- Inline edit for item details

---

### Customers

**Route:** `/customers`
**Files:**
- `frontend/src/pages/Customers/index.tsx`
- `frontend/src/pages/Customers/components/CustomerHistoryModal.tsx`
- `frontend/src/pages/Customers/components/SettleBalanceModal.tsx`
**IPC channels:** `customers:getAll`, `customers:create`, `customers:update`, `customers:delete`, `customers:getHistory`, `customers:settleBalance`

**Key behaviours:**
- Customer list with search
- History modal shows all past orders for a customer
- Settle balance modal records payment against outstanding amount

---

### Customer Detail

**Route:** `/customers/:id`
**Files:**
- `frontend/src/pages/CustomerDetail/index.tsx`
**IPC channels:** `customers:getById`, `customers:getHistory`

**Key behaviours:**
- Full customer profile with stats and order history
- Edit customer details inline

---

### Staff

**Route:** `/staff`
**Files:**
- `frontend/src/pages/Staff/index.tsx`
**IPC channels:** `staff:getAll`, `staff:upsert`, `staff:delete`, `shifts:getActive`, `shifts:open`, `shifts:close`, `shifts:getTotals`

**Key behaviours:**
- Staff list with role badges and active/inactive status
- Add/edit modal with PIN entry (masked)
- Shift management per staff member: open with cash amount, close with closing cash

---

### Expenses

**Route:** `/expenses`
**Files:**
- `frontend/src/pages/Expenses/index.tsx`
**IPC channels:** `expenses:getAll`, `expenses:create`, `expenses:delete`

**Key behaviours:**
- Date-filtered expense list
- Quick-add form: category, amount, description
- Delete confirmation per entry

---

### Settings

**Route:** `/settings`
**Files:**
- `frontend/src/pages/Settings/index.tsx`
**IPC channels:** `settings:get`, `settings:save`, `backup:export`, `backup:import`, `backup:getAutoBackupConfig`, `backup:setAutoBackupConfig`, `backup:triggerNow`, `backup:selectAutoBackupPath`

**Key behaviours:**
- Outlet name, address, GSTIN form — saved to electron-store
- Printer test button
- Auto-backup configuration: path, frequency, enable/disable
- Manual export and import backup buttons

---

## Part 3: Shared Infrastructure

### `frontend/src/lib/ipc.ts`
Typed wrapper around `window.api`. Every IPC call in the frontend goes through this file. Provides TypeScript autocompletion and a single place to add logging or error handling.

### `frontend/src/store/auth.ts`
Zustand slice for authentication. Stores the logged-in staff object and exposes `login()` / `logout()` actions. Persisted to `sessionStorage` so login survives hot reloads in development.

### `frontend/src/store/order.ts`
Zustand slice for the current order cart. Stores items, selected table, cover count, and order type. Cleared on KOT submission or order cancel.

### `backend/src/db/index.ts`
SQLite connection singleton. Opens in WAL mode. Returns the same connection instance on every call — `better-sqlite3` is synchronous and not thread-safe; a singleton ensures no concurrent connection issues.

### `backend/src/db/migrate.ts`
Reads all `.sql` files from `backend/src/db/migrations/` in numeric order and executes them on startup. All migrations use `IF NOT EXISTS` — they are idempotent and safe to re-run.

### `backend/src/services/printer.ts`
Wrapper around `escpos-usb`. Exports `printKOT()` and `printBill()`. All printer calls are wrapped in try/catch — errors are thrown to the IPC handler which returns `{ success: false, error }`.

### `backend/src/services/billing.ts`
Business logic for bill creation: recalculates totals from `order_items` snapshots, generates bill number, inserts `bills` and `payments`, updates order status, triggers inventory deduction, and updates customer stats.

### `backend/src/services/backup.ts`
`exportBackup(destPath)` and `importBackup(srcPath)`. See system-flows.md for the WAL checkpoint and rollback logic.

---

## Part 4: Adding a New Feature (Checklist)

Use this sequence every time a new backend capability is added:

- [ ] **1. Add migration** — create `backend/src/db/migrations/0XX_description.sql` with `IF NOT EXISTS` guards. Never modify existing migration files.

- [ ] **2. Add IPC handler** — create or extend `backend/src/ipc/<module>.ts`. Register a handler with `ipcMain.handle('channel:name', async (_, payload) => { ... })`. Return `{ success: true, data }` or `{ success: false, error }`.

- [ ] **3. Register handler** — in `backend/src/main.ts`, call the module's `register*IPC()` function inside `app.whenReady()`.

- [ ] **4. Expose on contextBridge** — in `backend/src/preload.ts`, add the channel to the `contextBridge.exposeInMainWorld('api', { ... })` whitelist.

- [ ] **5. Add typed method** — in `frontend/src/lib/ipc.ts`, add a typed function that calls `window.api.invoke('channel:name', payload)`.

- [ ] **6. Build the UI** — create `frontend/src/pages/<Module>/index.tsx` and `components/` subfolder. Never put page-specific components in `src/components/`.

- [ ] **7. Add route** — in `frontend/src/app/app.tsx` (or wherever the router is configured), add a `<Route>` for the new page.

- [ ] **8. Add nav item** — if the feature needs a sidebar link, add it in `frontend/src/components/organisms/navigation/Sidebar.tsx`.

- [ ] **9. Add icon** — if a new icon is needed, add the `.svg` source to `frontend/icons/` and run `npm run generate-sprite --prefix frontend`. Use `<SvgSpriteLoader id="icon-name" />` to render it.

- [ ] **10. Run lint and build** — `npm run lint` and `npm run build` from both `frontend/` and `backend/`. Zero errors before committing.
