# Documentation Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a complete business + technical documentation suite for the Kitchen POS project, covering 10 Markdown files and 2 rendered HTML artifacts for two distinct audiences.

**Architecture:** Two audience-separated folder trees — `docs/business/` for restaurant owners/stakeholders and `docs/technical/` for developers. All content derived from source code, ARCHITECTURE.md, and README.md. HTML artifacts are rendered combined views for each audience.

**Tech Stack:** Markdown, HTML/CSS (inline styled artifacts), Electron + React + SQLite (the documented system)

## Global Constraints

- All content must accurately reflect the current codebase — no speculative features
- Business docs: plain language, zero technical jargon, no code blocks
- Technical docs: precise, code examples included, exact IPC payloads
- GST compliance details must match ARCHITECTURE.md exactly (CGST + SGST, HSN codes, INV-YYYY-XXXX format)
- Roles in the system: admin, manager, cashier, waiter
- Payment methods: cash, card, upi, complimentary
- Order statuses: open, kot_sent, billed, cancelled
- Platform: Windows 10+ and macOS 12+, offline-first, no internet required

---

### Task 1: `docs/business/product-overview.md`

**Files:**
- Create: `docs/business/product-overview.md`

**Interfaces:**
- Consumes: README.md (features list, platform, GST compliance notes), ARCHITECTURE.md §1 (project structure)
- Produces: product overview document consumed by business HTML artifact (Task 11)

- [ ] **Step 1: Write the document**

Content must include these sections in order:
1. **What is Kitchen POS?** — One paragraph: offline-first restaurant POS for Indian restaurants, runs on Windows/macOS, no internet or subscription required
2. **Who is it for?** — Small to mid-size restaurants, single terminal, one location
3. **Key benefits** — Bullet list: offline reliability, GST-compliant invoicing, thermal printing, no recurring fees, data stays on your hardware
4. **What's included** — Feature list in plain language (Order management, Table management, Menu management, GST billing, KOT printing, Inventory tracking, Staff management, Reports, Backup & restore, Customer management, Expense tracking)
5. **Platform requirements** — Windows 10+ or macOS 12+, USB thermal printer (optional), no internet required
6. **First-time setup summary** — 6 steps: login with PIN 1234, fill outlet details, configure printer, add menu items, set up tables, change admin PIN

- [ ] **Step 2: Self-check**

Verify: no code or technical terms visible, all features from README.md are mentioned, platform requirements are accurate, GST compliance mentioned without jargon.

- [ ] **Step 3: Commit**

```bash
git add docs/business/product-overview.md
git commit -m "docs: add business product overview"
```

---

### Task 2: `docs/business/features.md`

**Files:**
- Create: `docs/business/features.md`

**Interfaces:**
- Consumes: README.md (features), ARCHITECTURE.md §13 (UI/UX conventions, flows), frontend/src/pages/ (module list)
- Produces: feature reference consumed by business HTML artifact (Task 11)

- [ ] **Step 1: Write the document**

One section per feature module. Each section: 2-3 sentence description + bullet list of what staff can do. Cover all 15 modules:

1. **Order Management** — Create orders for dine-in tables or takeaway. Add, edit, remove items. Send kitchen order tickets (KOT) to the printer. Track order status from open through to billed.
2. **Table Management** — Visual floor plan showing all tables. Colour-coded status: green (available), amber (occupied), red (bill requested). Tap a table to open or view its order.
3. **Menu Management** — Add categories and items. Mark items as veg or non-veg. Set prices, GST rates, and HSN codes per item. Toggle items as available or unavailable.
4. **GST Billing** — Generate GST-compliant invoices with sequential bill numbers (INV-YYYY-XXXX). Bills show taxable amount, CGST, SGST, and grand total. Accept payment by cash, card, UPI, or complimentary.
5. **KOT Printing** — Send kitchen order tickets directly to a USB thermal printer. KOT shows table name, time, item list, and any notes.
6. **Inventory Tracking** — Track stock levels for ingredients. Set low-stock alerts. Log purchases, adjustments, and wastage. Stock auto-deducts when items are sold.
7. **Staff Management** — PIN-based login for each staff member. Four roles: admin, manager, cashier, waiter. Track shift open and close times.
8. **Reports** — Daily sales summary, GST report, payment method breakdown, hourly sales chart. Filter by date range.
9. **Past Orders** — View and search all historical orders and bills.
10. **Customer Management** — Maintain a customer list. View order history per customer. Track outstanding balances.
11. **Expenses** — Log daily expenses with category and notes.
12. **Kitchen Display Screen (KDS)** — Display pending kitchen orders on a second screen.
13. **Dashboard** — At-a-glance summary of today's sales, orders, and alerts.
14. **Settings** — Configure outlet name, address, GSTIN, printer, and backup schedule.
15. **Backup & Restore** — One-click export of the entire database. Import to restore. Recommended daily.

- [ ] **Step 2: Self-check**

Verify: every module in `frontend/src/pages/` is represented, no code terms used, veg/non-veg flag mentioned, GST accuracy correct.

- [ ] **Step 3: Commit**

```bash
git add docs/business/features.md
git commit -m "docs: add business features reference"
```

---

### Task 3: `docs/business/user-stories.md`

**Files:**
- Create: `docs/business/user-stories.md`

**Interfaces:**
- Consumes: ARCHITECTURE.md §13 (KOT flow, bill flow, role list), README.md (keyboard shortcuts)
- Produces: user stories consumed by business HTML artifact (Task 11)

- [ ] **Step 1: Write the document**

Group by role. Format: `As a [role], I want to [action] so that [benefit].` followed by acceptance criteria bullets.

**Admin:**
- As an admin, I want to configure the outlet name, GSTIN, and address so that all printed bills are legally compliant.
  - Acceptance: Settings screen has outlet name, address, GSTIN fields. Changes reflect on next printed bill.
- As an admin, I want to add and manage staff PINs so that each employee has their own secure login.
  - Acceptance: Can create staff with name, PIN, and role. Can deactivate staff without deleting their history.
- As an admin, I want to export a database backup so that I can recover from hardware failure.
  - Acceptance: One click exports a .sqlite file to chosen location. File restores the full system when imported.
- As an admin, I want to view GST reports for any date range so that I can file returns accurately.
  - Acceptance: Reports screen shows taxable amount, CGST total, SGST total per date range.

**Manager:**
- As a manager, I want to view daily sales totals so that I can track revenue without logging into a separate system.
  - Acceptance: Dashboard shows today's total sales, number of orders, and payment method breakdown.
- As a manager, I want to manage the menu so that prices and availability stay current.
  - Acceptance: Can add, edit, and deactivate menu items. Changes take effect on next order.
- As a manager, I want to see low-stock alerts so that I can reorder before running out.
  - Acceptance: Inventory screen highlights items below their alert threshold.

**Cashier:**
- As a cashier, I want to generate a GST bill so that the customer receives a legal invoice.
  - Acceptance: Bill shows bill number, date, itemised list with HSN codes, CGST, SGST, and grand total.
- As a cashier, I want to accept split payments so that customers can pay part cash, part UPI.
  - Acceptance: Payment modal allows multiple payment entries that sum to the bill total.
- As a cashier, I want to print the bill receipt so that the customer has a physical copy.
  - Acceptance: Thermal printer produces bill with all GST line items within 5 seconds of payment.

**Waiter:**
- As a waiter, I want to open a new order for a table so that I can take a customer's food order.
  - Acceptance: Tapping an available table opens a new order. Table turns amber immediately.
- As a waiter, I want to send a KOT to the kitchen so that the chef knows what to prepare.
  - Acceptance: "Send to Kitchen" prints a KOT slip with table name, time, and item list. Order status turns to KOT Sent.
- As a waiter, I want to add or remove items from an open order so that I can handle changes before billing.
  - Acceptance: Can add items and increase/decrease quantities while order is in open or KOT sent status.

- [ ] **Step 2: Self-check**

Verify: all four roles covered, acceptance criteria are testable, no technical terms, flows match ARCHITECTURE.md §13.

- [ ] **Step 3: Commit**

```bash
git add docs/business/user-stories.md
git commit -m "docs: add role-based user stories with acceptance criteria"
```

---

### Task 4: `docs/business/release-notes-v1.md`

**Files:**
- Create: `docs/business/release-notes-v1.md`

**Interfaces:**
- Consumes: git log (recent commits), README.md (features), frontend/src/pages/ (module list)
- Produces: release notes consumed by business HTML artifact (Task 11)

- [ ] **Step 1: Write the document**

```markdown
# Release Notes — v1.0

**Released:** June 2026  
**Platform:** Windows 10+ · macOS 12+  
**Status:** Live

---

## What's in v1.0

This is the first production release of Kitchen POS. The following features are fully built and in active use.

### Order & Table Management
- Create dine-in orders linked to specific tables
- Visual floor plan with real-time table status (available / occupied / bill requested)
- Add, edit, and remove items from open orders
- Per-item notes for kitchen instructions
- Cover count tracking per order

### Kitchen Order Tickets (KOT)
- One-tap KOT printing to USB thermal printer
- KOT shows table name, time, items, quantities, and notes
- Order status updates automatically after KOT is sent

### Menu Management
- Multi-menu support with create, rename, and clone
- Categories with sort order
- Items with price, veg/non-veg flag, availability toggle
- Per-item GST rates (CGST + SGST) and HSN codes

### GST-Compliant Billing
- Sequential invoice numbers (INV-YYYY-XXXX) with no gaps
- Tax rates snapshotted at order time — historical bills are never affected by rate changes
- Payment by cash, card, UPI, or complimentary
- Split payment across multiple methods
- Printed bill includes all GST line items as required by law

### Inventory
- Stock level tracking per ingredient
- Low-stock alert thresholds
- Inventory log: purchases, adjustments, wastage
- Auto-deduction on sale (via menu-inventory mapping)

### Staff & Shifts
- PIN-based login (4-digit)
- Four roles: admin, manager, cashier, waiter
- Shift open and close with cash tracking

### Customer Management
- Customer list with contact details
- Order history per customer
- Outstanding balance tracking and settlement

### Reports
- Daily sales summary
- GST report with CGST/SGST breakdown
- Payment method breakdown (cash / card / UPI / complimentary)
- Hourly sales chart
- Date range filtering

### Past Orders
- Full order and bill history
- Search and filter

### Expenses
- Daily expense logging with category and notes

### Dashboard
- Today's sales total, order count, and key metrics at a glance

### Settings & Backup
- Outlet name, address, GSTIN configuration
- Printer test and configuration
- One-click database export (.sqlite)
- One-click database import with automatic rollback on failure
- Scheduled end-of-day backup reminder

---

## Known Limitations in v1.0

- Single terminal only — no multi-device LAN sync
- Single printer — one USB thermal printer per installation
- No cloud backup — backups are local files only
- No UPI QR code on printed receipts
- KDS (Kitchen Display Screen) requires second monitor setup — coming in v1.1

---

## Upgrade Notes

This is a fresh installation — no upgrade path from a prior version.
```

- [ ] **Step 2: Self-check**

Verify: all features match what's actually in the codebase, limitations are honest, no promised features that aren't built.

- [ ] **Step 3: Commit**

```bash
git add docs/business/release-notes-v1.md
git commit -m "docs: add v1.0 release notes"
```

---

### Task 5: `docs/business/roadmap.md`

**Files:**
- Create: `docs/business/roadmap.md`

**Interfaces:**
- Consumes: README.md (Roadmap section)
- Produces: roadmap document consumed by business HTML artifact (Task 11)

- [ ] **Step 1: Write the document**

```markdown
# Product Roadmap

This roadmap reflects planned features in priority order. Dates are targets, not guarantees.

---

## v1.1 — Kitchen Display Screen
**Target:** Q3 2026

- KDS on a second monitor — kitchen staff see pending orders on a dedicated screen without paper slips
- Orders appear and disappear automatically as KOTs are sent and completed
- No additional hardware required beyond a second monitor

## v1.2 — Digital Bill Delivery
**Target:** Q3 2026

- UPI QR code printed on the customer bill receipt
- WhatsApp bill delivery — send the GST invoice directly to the customer's phone

## v1.3 — Multi-Terminal Sync
**Target:** Q4 2026

- Two or more billing terminals on the same local network
- Orders placed on one terminal are visible on another in real time
- No internet required — works entirely on local Wi-Fi

## v1.4 — Cloud Backup
**Target:** Q1 2027

- Automatic daily backup to Google Drive
- Restore from cloud on any machine
- Backup history with point-in-time restore

## v1.5 — Customer Loyalty
**Target:** Q1 2027

- Loyalty points earned per visit
- Membership tiers with discount rules
- Points redeemable at billing

---

## Requested but not yet scheduled

- Aggregator integration (Swiggy / Zomato order import)
- Staff performance reports
- Recipe costing (ingredient cost vs menu price margin)
- Table reservation / booking system
```

- [ ] **Step 2: Self-check**

Verify: all items from README.md roadmap section are included, no features promised that haven't been discussed.

- [ ] **Step 3: Commit**

```bash
git add docs/business/roadmap.md
git commit -m "docs: add product roadmap"
```

---

### Task 6: `docs/technical/functional-spec.md`

**Files:**
- Create: `docs/technical/functional-spec.md`

**Interfaces:**
- Consumes: ARCHITECTURE.md §7 (schema), §8 (IPC), §13 (flows), backend/src/ipc/ (all handlers)
- Produces: functional spec consumed by technical HTML artifact (Task 12)

- [ ] **Step 1: Write the document**

One section per module. Each section covers: purpose, inputs, outputs, business rules, edge cases. Cover all 15 modules. Example structure for each:

```
## [Module Name]

**Purpose:** [one sentence]

**Inputs:** [what triggers this module — user action, IPC call, etc.]

**Outputs:** [what it produces — DB rows, printed output, UI state change]

**Business rules:**
- [rule 1]
- [rule 2]

**Edge cases:**
- [edge case 1 and how it's handled]
```

Modules to cover (with key rules):

**Orders**
- Rules: order must be linked to a table; items snapshot price+tax at add time; KOT only prints unprinted items (kot_printed=0); order status transitions: open → kot_sent → billed/cancelled
- Edge cases: adding items after KOT sent (only new items print on next KOT); cancelling a billed order is not allowed

**Tables**
- Rules: status derived from order state, not stored directly; available = no open order; occupied = open order exists; bill_requested = billing modal open
- Edge cases: table clears to available only after payment is recorded and order status = billed

**Menu**
- Rules: items belong to exactly one category; price and tax rates on the item are the live rates for new orders only; historical order_items are never updated
- Edge cases: toggling is_available mid-shift hides item from new orders but does not affect open orders

**Billing**
- Rules: bill number is sequential (INV-YYYY-XXXX), stored in electron-store; tax is recalculated from order_items snapshots at bill creation; payment must sum to or exceed bill total; complimentary orders have zero payment
- Edge cases: partial payment not allowed — must settle full amount; crash during bill creation rolls back bill number increment

**KOT Printing**
- Rules: only items with kot_printed=0 are included; after print, all included items are marked kot_printed=1; if printer fails, no items are marked
- Edge cases: printer offline → show retry dialog; partial print (printer jams mid-slip) → items remain unprinted, retry reprints all

**Inventory**
- Rules: stock deducts via menu_inventory_map on each billed order_item; adjustment types: purchase (positive), sale (negative, auto), wastage (negative, manual), adjustment (any)
- Edge cases: menu item with no inventory mapping does not deduct stock; negative stock is allowed (warning only)

**Staff**
- Rules: PIN stored as bcrypt hash; role determines UI access (waiter cannot access reports or settings); admin role required for backup import, staff management, settings save
- Edge cases: 3 wrong PIN attempts → 60-second lockout; deactivated staff cannot log in but their historical orders remain linked

**Reports**
- Rules: daily report groups by business day (midnight to midnight); GST report sums CGST and SGST from bills table; payment breakdown from payments table grouped by method
- Edge cases: date with no orders returns zero values, not an error

**Backup**
- Rules: export = WAL checkpoint then file copy; import = close DB, backup existing file to .bak, copy new file, reopen; on import failure, restore from .bak
- Edge cases: import of a corrupt file → restore .bak silently, show error to user

**Settings**
- Rules: outlet name, address, GSTIN stored in electron-store (not SQLite); GSTIN format validated (15 chars); printer settings (port, baud) stored in electron-store
- Edge cases: GSTIN field can be blank for unregistered restaurants (composition scheme or below threshold)

- [ ] **Step 2: Self-check**

Verify: all 15 modules covered, business rules match ARCHITECTURE.md, edge cases are specific not vague.

- [ ] **Step 3: Commit**

```bash
git add docs/technical/functional-spec.md
git commit -m "docs: add technical functional specification"
```

---

### Task 7: `docs/technical/system-flows.md`

**Files:**
- Create: `docs/technical/system-flows.md`

**Interfaces:**
- Consumes: ARCHITECTURE.md §3 (security model), §13 (flows), backend/src/ipc/orders.ts, billing.ts, printer.ts
- Produces: system flows consumed by technical HTML artifact (Task 12)

- [ ] **Step 1: Write the document**

Include ASCII flow diagrams for each major flow.

**Flow 1: Application startup**
```
Electron main process starts
    │
    ├─► Run DB migrations (migrate.ts)
    │       └─► Execute pending .sql files in order
    ├─► Open BrowserWindow
    │       └─► Load React app (localhost:5200 in dev, file:// in prod)
    ├─► Register all IPC handlers (ipc/*.ts)
    └─► Show PIN login screen
```

**Flow 2: Order lifecycle**
```
Waiter selects available table
    │
    └─► orders:create { table_id, staff_id, covers }
            │
            └─► INSERT orders (status='open')
                    │
                    └─► Waiter adds items
                            │
                            └─► orders:addItem { order_id, menu_item_id, qty }
                                    │
                                    └─► Snapshot price+tax from menu_items
                                            INSERT order_items (kot_printed=0)
                                                    │
                                                    └─► Waiter sends to kitchen
                                                            │
                                                            └─► print:kot { order_id }
                                                                    │
                                                                    ├─► SELECT items WHERE kot_printed=0
                                                                    ├─► Print KOT slip
                                                                    ├─► UPDATE order_items SET kot_printed=1
                                                                    └─► UPDATE orders SET status='kot_sent'
```

**Flow 3: Billing and payment**
```
Cashier opens occupied table → "Generate Bill"
    │
    └─► billing:createBill { order_id, payments[], discount }
            │
            ├─► Recalculate totals from order_items snapshots
            ├─► Generate bill number (electron-store increment)
            ├─► INSERT bills
            ├─► INSERT payments (one row per payment method)
            ├─► UPDATE orders SET status='billed'
            └─► Deduct inventory (menu_inventory_map)
                    │
                    └─► print:bill { bill_id }
                                │
                                ├─► Build GST receipt (outlet name, GSTIN, address,
                                │   bill number, date/time, items+HSN, CGST, SGST, total)
                                └─► Print to USB thermal printer
                                        │
                                        └─► Table status → available
```

**Flow 4: IPC security boundary**
```
React (Renderer)
    │
    │  window.api.invoke('channel', payload)
    ▼
preload.ts (contextBridge whitelist)
    │
    │  ipcRenderer.invoke('channel', payload)
    ▼
main.ts (ipcMain.handle)
    │
    ├─► ipc/orders.ts / menu.ts / billing.ts / ...
    │       │
    │       ├─► better-sqlite3 (SQLite)
    │       ├─► escpos-usb (thermal printer)
    │       ├─► electron-store (settings)
    │       └─► fs (backup)
    │
    └─► Returns { success: boolean, data?: any, error?: string }
```

**Flow 5: Backup and restore**
```
Export:
    Settings → Export Backup → choose file path
        │
        └─► backup:export { path }
                │
                ├─► db.pragma('wal_checkpoint(TRUNCATE)')
                └─► fs.copyFileSync(pos.db → chosen path)

Import:
    Settings → Import Backup → choose .sqlite file
        │
        └─► backup:import { path }
                │
                ├─► db.close()
                ├─► fs.copyFileSync(pos.db → pos.db.bak)   ← rollback copy
                ├─► fs.copyFileSync(chosen path → pos.db)
                │       └─► On failure: restore from pos.db.bak
                └─► Reopen DB connection
```

- [ ] **Step 2: Self-check**

Verify: flows match actual IPC handler logic, security boundary diagram matches ARCHITECTURE.md §3, all major user journeys covered.

- [ ] **Step 3: Commit**

```bash
git add docs/technical/system-flows.md
git commit -m "docs: add system flows with ASCII diagrams"
```

---

### Task 8: `docs/technical/ipc-api-reference.md`

**Files:**
- Create: `docs/technical/ipc-api-reference.md`

**Interfaces:**
- Consumes: ARCHITECTURE.md §8 (IPC table), backend/src/ipc/*.ts (actual handlers), backend/src/main.ts (registrations)
- Produces: IPC reference consumed by technical HTML artifact (Task 12)

- [ ] **Step 1: Write the document**

Format per channel:
```
### `channel:name`
**Direction:** Renderer → Main  
**Payload:** `{ field: type, ... }`  
**Returns:** `{ success: true, data: { ... } }` or `{ success: false, error: string }`  
**Notes:** [any constraints or side effects]
```

Cover all channels from ARCHITECTURE.md §8 plus any additional ones found in backend/src/ipc/ files. Group by domain:

- Orders (orders:create, orders:addItem, orders:updateItem, orders:removeItem, orders:getOpen, orders:getByTable, orders:getAll, orders:getById)
- Printing (print:kot, print:bill, print:test)
- Billing (billing:createBill, billing:getBill)
- Menu (menu:getAll, menu:upsertItem, menu:deleteItem, menu:toggleAvailable, menu:getMenus, menu:createMenu, menu:renameMenu, menu:cloneMenu)
- Tables (tables:getAll, tables:upsert, tables:delete)
- Inventory (inventory:getAll, inventory:upsert, inventory:adjust, inventory:delete)
- Staff (staff:login, staff:getAll, staff:upsert, staff:delete)
- Reports (reports:daily, reports:gst, reports:paymentBreakdown, reports:hourly)
- Customers (customers:getAll, customers:upsert, customers:delete, customers:getHistory, customers:settleBalance)
- Backup (backup:export, backup:import)
- Settings (settings:get, settings:save)
- Dashboard (dashboard:getSummary)

**Standard response envelope** (document at top of file):
```ts
// Every IPC handler returns this shape
type IPCResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

- [ ] **Step 2: Verify against actual code**

Read `backend/src/ipc/*.ts` files and `backend/src/main.ts` to confirm channel names and payloads match what's written. Fix any discrepancies.

- [ ] **Step 3: Commit**

```bash
git add docs/technical/ipc-api-reference.md
git commit -m "docs: add IPC API reference"
```

---

### Task 9: `docs/technical/data-model.md`

**Files:**
- Create: `docs/technical/data-model.md`

**Interfaces:**
- Consumes: ARCHITECTURE.md §7 (full schema), backend/src/db/migrations/*.sql (actual migrations)
- Produces: data model reference consumed by technical HTML artifact (Task 12)

- [ ] **Step 1: Write the document**

For each table:
1. DDL (CREATE TABLE statement)
2. Field descriptions table (field | type | description)
3. Key design decisions (1-3 bullets)
4. Relationships (foreign keys, what they reference)

Tables to cover: staff, categories, menu_items, tables, orders, order_items, payments, bills, inventory_items, menu_inventory_map, inventory_log, shifts, customers (if exists), expenses (if exists)

Include a section on **non-database persistence** (electron-store):
- `last_bill_number` — integer, increments on each bill, used for INV-YYYY-XXXX sequencing
- `outlet_name`, `outlet_address`, `gstin` — outlet identity on all printed bills
- `printer_*` — USB printer configuration

Include a section on **design decisions**:
- Why tax rates are snapshotted on order_items (not live-looked-up from menu_items)
- Why bill_number lives in electron-store not SQLite
- Why WAL mode is enabled
- Why better-sqlite3 (synchronous) is used over async SQLite drivers

- [ ] **Step 2: Verify against migrations**

Read actual migration files in `backend/src/db/migrations/` and confirm schema matches. Add any tables present in migrations but missing from ARCHITECTURE.md.

- [ ] **Step 3: Commit**

```bash
git add docs/technical/data-model.md
git commit -m "docs: add data model reference"
```

---

### Task 10: `docs/technical/module-guide.md`

**Files:**
- Create: `docs/technical/module-guide.md`

**Interfaces:**
- Consumes: ARCHITECTURE.md §1, §5 (atomic design), README.md (project structure), frontend/src/pages/, backend/src/ipc/
- Produces: module guide consumed by technical HTML artifact (Task 12)

- [ ] **Step 1: Write the document**

**Part 1: Architecture overview**
- Electron two-process model (main + renderer)
- IPC as the only communication channel
- Atomic design layers (atoms → molecules → organisms → pages)
- Zustand state slices
- Module pattern (frontend/src/modules/<domain>/ owns business logic, pages own UI)

**Part 2: Per-module breakdown**

For each frontend page module:
```
## [Module]
**Route:** /path  
**Files:**  
- `frontend/src/pages/[Module]/index.tsx` — main page component  
- `frontend/src/pages/[Module]/components/` — page-specific components  
- `backend/src/ipc/[module].ts` — IPC handlers  
**State:** [which Zustand slices or local state it uses]  
**IPC channels used:** [list]  
**Key behaviours:** [2-3 bullet points]
```

Cover: Order, Tables, Menu, KDS, Dashboard, Reports, PastOrders, Inventory, Customers, Staff, Expenses, Settings, Login

**Part 3: Shared infrastructure**
- `frontend/src/lib/ipc-client.ts` — typed wrapper around window.api
- `frontend/src/lib/tax-calc.ts` — GST calculation helpers
- `frontend/src/lib/formatters.ts` — currency, date formatters
- `backend/src/db/index.ts` — SQLite singleton (WAL mode)
- `backend/src/db/migrate.ts` — auto-runs migrations on startup
- `backend/src/services/printer.ts` — escpos-usb wrapper
- `backend/src/services/gst.ts` — calcLineItemTax function
- `backend/src/services/backup.ts` — exportBackup, importBackup

**Part 4: Adding a new feature (checklist)**
1. Add migration in `backend/src/db/migrations/00X_description.sql`
2. Add IPC handler in `backend/src/ipc/<module>.ts`
3. Register handler in `backend/src/main.ts`
4. Expose on contextBridge in `backend/src/preload.ts`
5. Add typed method in `frontend/src/lib/ipc-client.ts`
6. Create page in `frontend/src/pages/<Module>/index.tsx`
7. Add route in `frontend/src/app/app.tsx`
8. Add nav item in `frontend/src/components/organisms/navigation/Sidebar.tsx`

- [ ] **Step 2: Self-check**

Verify: all pages in frontend/src/pages/ are covered, the new-feature checklist matches the actual IPC registration flow in main.ts.

- [ ] **Step 3: Commit**

```bash
git add docs/technical/module-guide.md
git commit -m "docs: add module architecture guide"
```

---

### Task 11: Business HTML Artifact

**Files:**
- Create: `docs/business/index.html` — combined styled HTML of all 5 business docs

**Interfaces:**
- Consumes: Tasks 1–5 (all business Markdown files)
- Produces: rendered HTML for stakeholder sharing via Artifact tool

- [ ] **Step 1: Build the combined HTML**

Combine all 5 business docs into a single styled HTML page with:
- Sidebar navigation (Product Overview, Features, User Stories, Release Notes, Roadmap)
- Clean sans-serif typography, no code blocks visible
- Section anchors for deep-linking
- Print-friendly CSS (`@media print`)
- No external dependencies — fully self-contained

- [ ] **Step 2: Render via Artifact tool**

Call the Artifact tool with `file_path: docs/business/index.html`

- [ ] **Step 3: Commit**

```bash
git add docs/business/index.html
git commit -m "docs: add business documentation HTML artifact"
```

---

### Task 12: Technical HTML Artifact

**Files:**
- Create: `docs/technical/index.html` — combined styled HTML of all 5 technical docs

**Interfaces:**
- Consumes: Tasks 6–10 (all technical Markdown files)
- Produces: rendered HTML for developer reference via Artifact tool

- [ ] **Step 1: Build the combined HTML**

Combine all 5 technical docs into a single styled HTML page with:
- Sidebar navigation (Functional Spec, System Flows, IPC API Reference, Data Model, Module Guide)
- Monospace code blocks with syntax highlighting (inline CSS, no external libraries)
- Section anchors
- Dark-mode friendly (`prefers-color-scheme: dark`)
- No external dependencies — fully self-contained

- [ ] **Step 2: Render via Artifact tool**

Call the Artifact tool with `file_path: docs/technical/index.html`

- [ ] **Step 3: Commit**

```bash
git add docs/technical/index.html
git commit -m "docs: add technical documentation HTML artifact"
```

---

## Execution Order

Tasks 1–5 (business docs) can run in parallel.  
Tasks 6–10 (technical docs) can run in parallel.  
Tasks 11–12 (HTML artifacts) must run after their respective doc sets are complete.

Recommended sequence for a single session: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
