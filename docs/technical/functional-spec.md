# Kitchen POS — Functional Specification

End-to-end functional specification per module. Each section covers purpose, inputs, outputs, business rules, and edge cases. All rules are derived from the actual codebase.

---

## 1. Orders

**Purpose:** Create and manage food orders from table assignment through to kitchen dispatch.

**Inputs:** Table ID, staff ID, cover count, menu item selections, item notes, order type (dine-in / takeaway / delivery), optional customer ID.

**Outputs:** Order record in `orders` table, order item records in `order_items` table (with price and tax snapshots), order ID returned to renderer.

**Business rules:**
- Every order must be linked to a table via `table_id`; takeaway and delivery orders still reference a table record
- Order type defaults to `dine-in`; valid values: `dine-in`, `takeaway`, `delivery`
- Order status transitions follow: `open` → `kot_sent` → `billed` (or `cancelled` at any pre-billed stage)
- When an item is added to an order, `name`, `unit_price`, `cgst_rate`, `sgst_rate`, and `hsn_code` are **snapshotted** from `menu_items` at that moment — subsequent changes to the menu item do not affect this order
- `business_date` is stamped from the active business session at order creation time; if no session is open, `business_date` is `NULL`
- A customer can be linked to an order at creation or updated later via `orders:updateCustomer`

**Edge cases:**
- Adding items to an order after KOT has been sent: allowed — the new items have `kot_printed = 0` and will appear on the next KOT
- Cancelling a billed order: not permitted — status `billed` is terminal
- Order created with no active business session: allowed, but `business_date` will be `NULL` and the order will not appear in business-session-scoped reports

---

## 2. KOT (Kitchen Order Tickets)

**Purpose:** Print a kitchen slip containing only the items not yet dispatched to the kitchen, then mark those items as dispatched.

**Inputs:** Table ID and cart item payload from the frontend (item list, staff ID, covers, note, customer ID, order type).

**Outputs:** KOT printed to USB thermal printer; `order_items.kot_printed` set to `1` for all printed items; order status updated to `kot_sent`.

**Business rules:**
- The `print:sendKOT` handler creates or updates the order atomically:
  - If an open order exists for the table, items are added to it
  - If no open order exists, a new order is created
- Only items with `kot_printed = 0` are included on the KOT slip
- After successful print, all included items are updated to `kot_printed = 1`
- KOT slip shows: table name, current time, each item with quantity and note, order-level note
- If the printer call throws, no items are marked as printed — the operation is all-or-nothing per KOT send

**Edge cases:**
- Printer offline: exception propagates to renderer; renderer shows retry dialog; items remain `kot_printed = 0`
- All items already printed (`kot_printed = 1`): KOT slip prints as empty (no items section); this is a UI concern to prevent
- Multiple KOT sends for the same order: only genuinely new or unprinted items appear on subsequent slips

---

## 3. Tables

**Purpose:** Display the restaurant floor plan with live table status derived from order state.

**Inputs:** No payload for `tables:getAll`; table ID + fields for `tables:upsert`; table ID for `tables:delete`.

**Outputs:** Array of table records with computed status field.

**Business rules:**
- Table status is derived, not stored: `available` = no open order for this table; `occupied` = open order exists; `bill_requested` = billing modal is open (frontend state only — not persisted)
- A table clears to `available` only when its linked order reaches `status = 'billed'`
- Tables have a `section` field for organising the floor plan (e.g. "Main Hall", "Outdoor")
- Capacity is stored but not enforced — a table can have more covers than its capacity

**Edge cases:**
- Deleting a table that has open orders: should be prevented at the UI level; no DB-level constraint exists
- Two devices accessing the same table simultaneously (if multi-terminal is ever added): last write wins — no locking

---

## 4. Menu

**Purpose:** Manage the full menu hierarchy: menus → categories → items.

**Inputs:** Menu payloads (name, is_default, schedule fields); category payloads (menu_id, name, sort_order); item payloads (category_id, name, price, cgst_rate, sgst_rate, hsn_code, is_veg, is_available, sort_order, image_url).

**Outputs:** Updated menu, category, and item records; image files saved to user data directory for uploaded images.

**Business rules:**
- A menu contains categories; a category belongs to exactly one menu via `menu_id`
- Exactly one menu should have `is_default = 1` at any time — the default menu loads on the order screen
- Items inherit their menu indirectly through their category
- Toggling `is_available = 0` on an item hides it from the order screen immediately; it does not affect open orders containing that item
- Price, CGST rate, and SGST rate on the item are the rates for new orders only — historical `order_items` snapshots are never updated
- Menu scheduling fields (`auto_enable_time`, `auto_disable_time`, `schedule_enabled`) support time-based menu switching (e.g. breakfast menu, dinner menu)
- Images are stored as files in the user data directory; `image_url` on the item stores the path

**Edge cases:**
- Deleting a category that contains items: cascades to items at the application layer (not a DB-level cascade)
- Cloning a menu: duplicates the menu record, all its categories, and all items — with new IDs
- Renaming the default menu does not change which menu is default

---

## 5. Billing

**Purpose:** Convert a completed order into a GST-compliant bill, record payment, and close the order.

**Inputs:** Order ID, payments array (`[{ method, amount, reference? }]`), optional discount amount, optional customer ID.

**Outputs:** Bill record in `bills` table; payment records in `payments` table; order status updated to `billed`; inventory deducted; customer stats updated if linked.

**Business rules:**
- Bill number format: `INV-YYYY-XXXX` where XXXX is a zero-padded 4-digit sequential counter stored in `electron-store` (key: `last_bill_number`)
- Tax totals are recalculated at bill creation time from `order_items` snapshots — not from live menu item rates
- Payment methods allowed: `cash`, `card`, `upi`, `complimentary`, `unpaid`
- Payment total must equal the bill's `total_amount` — partial payment is not accepted
- Complimentary orders: single payment entry with `method = 'complimentary'` and `amount = 0`
- `unpaid` method: used for credit extended to a customer; increments `customers.outstanding_balance`
- Discount is applied before tax recalculation
- After billing: `orders.status` → `billed`; inventory auto-deducts via `menu_inventory_map`
- If a customer is linked: `customers.total_visits` incremented; `outstanding_balance` updated for unpaid amounts

**Edge cases:**
- Bill number increment on crash: `electron-store` is written before the DB transaction; if the transaction rolls back, the bill number is consumed but never used — gaps in INV sequence are possible after crashes but sequential order is maintained
- Billing an order with no items: must be prevented at the UI level — no DB constraint blocks it
- Customer linked at billing vs at order creation: both paths work; `billing:createBill` accepts `customerId` and writes it to `bills.customer_id`

---

## 6. Inventory

**Purpose:** Track stock levels, log inventory movements, and auto-deduct on sale.

**Inputs:** Inventory item fields (name, unit, qty_in_stock, low_stock_alert_at, cost_per_unit); adjustment payload (item_id, qty_change, type, note).

**Outputs:** Updated `inventory_items.qty_in_stock`; new `inventory_log` row for every change.

**Business rules:**
- Adjustment types: `purchase` (positive qty_change), `sale` (negative, auto-triggered), `adjustment` (any direction, manual), `wastage` (negative, manual)
- Stock auto-deducts on billing: for each `order_item` in a billed order, `menu_inventory_map` provides the `qty_used` per menu item per inventory item; deduction multiplied by `order_item.qty`
- Menu items with no `menu_inventory_map` entry do not trigger stock deduction
- Negative stock is permitted (no constraint) — only a visual alert at the UI level

**Edge cases:**
- Menu item mapped to multiple inventory items: each mapping deducts independently
- Inventory item mapped from multiple menu items: cumulative deduction per billing event
- Adjusting stock manually while an order for that item is open: manual adjustment applies immediately; the auto-deduction will still apply at billing — no locking

---

## 7. Staff

**Purpose:** Manage staff accounts, PINs, and roles; handle login and access control.

**Inputs:** Staff fields (name, pin, role, is_active); login payload (pin).

**Outputs:** Staff records; login returns matched staff object or null.

**Business rules:**
- PINs are stored as bcrypt hashes — plaintext PINs are never persisted
- Roles and their access: `admin` (full access), `manager` (menu, inventory, reports, orders), `cashier` (orders, billing), `waiter` (order-taking only)
- PIN lockout: 3 consecutive wrong attempts for the same staff member triggers a 60-second lockout (tracked in `electron-store`)
- Deactivated staff (`is_active = 0`) cannot log in; their historical orders remain linked
- Staff cannot be deleted if they have orders or bills referencing them — soft-delete via `is_active = 0`

**Edge cases:**
- Two staff with the same PIN: the login query matches the first result; duplicate PINs should be prevented at the UI level
- Admin deactivating themselves: must be prevented — there must always be at least one active admin

---

## 8. Shifts

**Purpose:** Track when staff open and close their work shift, with opening and closing cash amounts.

**Inputs:** Staff ID, opening cash amount (on open); closing cash amount, note (on close).

**Outputs:** Shift record in `shifts` table with timestamps.

**Business rules:**
- A staff member can have at most one open shift at a time
- Opening cash is recorded at shift start; closing cash at shift end
- Shifts are linked to a staff member — reports can aggregate sales by shift

**Edge cases:**
- Shift left open overnight: no auto-close — must be closed manually
- Business session vs shift: these are separate concepts; a business session tracks the business day, a shift tracks individual staff hours

---

## 9. Business Sessions

**Purpose:** Define the boundaries of a business day for reporting and order attribution.

**Inputs:** Business date (YYYY-MM-DD), started_by staff ID, notes.

**Outputs:** `business_sessions` record; `orders.business_date` and `bills.business_date` stamped from the active session.

**Business rules:**
- Only one session can be `status = 'open'` at a time — enforced by a unique partial index
- New orders and bills get their `business_date` from the currently open session
- If no session is open, `business_date` is `NULL`
- Closing a session: `status` → `closed`, `closed_at` timestamped, `closed_by` recorded
- Day-end reports filter by `business_date` — not by `created_at` timestamp

**Edge cases:**
- Session opened on Monday, closed on Tuesday (late-night service): all orders in that session get Monday's `business_date` regardless of `created_at`
- Attempting to open a second session while one is open: blocked by the unique index — DB throws, handler returns error

---

## 10. Customers

**Purpose:** Maintain a customer registry with visit history and balance tracking.

**Inputs:** Customer fields (name, phone, email, credit_limit); order/bill linkage; balance settlement payload.

**Outputs:** Customer records; `outstanding_balance` updated on unpaid billing or settlement.

**Business rules:**
- Phone number must be unique — `customers.phone` has a UNIQUE constraint
- `loyalty_points` and `total_visits` are incremented at billing when a customer is linked
- `outstanding_balance` increases when an `unpaid` payment is recorded; decreases when settled
- `credit_limit` is informational — no automatic enforcement in the billing flow

**Edge cases:**
- Linking a customer to an order after billing: `bills.customer_id` can be set retroactively
- Customer with outstanding balance being deleted: must be prevented at the UI level; no DB constraint blocks it

---

## 11. Reports

**Purpose:** Generate aggregated sales and tax data for daily review and GST filing.

**Inputs:** Date or date range; report type.

**Outputs:** Aggregated totals from `bills`, `payments`, `order_items` filtered by `business_date` or `created_at`.

**Business rules:**
- Daily report groups by `business_date` (from the business session, not raw timestamp)
- GST report sums `cgst_amount` and `sgst_amount` from the `bills` table
- Payment breakdown groups `payments` by `method`
- Only `billed` orders are included — open and cancelled orders are excluded from all reports
- Date with no orders returns zero values, not an error

**Edge cases:**
- Orders with `NULL` business_date (created outside a session): excluded from business-date-filtered reports; included in timestamp-filtered reports
- Report spanning a session boundary: depends on filter type — `business_date` filter is clean; timestamp filter may split orders across two business days

---

## 12. Dashboard

**Purpose:** Show a real-time summary of today's activity on the home screen.

**Inputs:** Current date / active business session.

**Outputs:** Today's total sales, order count, open table count, low-stock item count.

**Business rules:**
- Figures reflect the current business session's `business_date`
- Sales total includes only `billed` orders
- Open tables count is derived from orders with `status != 'billed'` and `status != 'cancelled'`
- Low-stock count is items where `qty_in_stock <= low_stock_alert_at`

---

## 13. Expenses

**Purpose:** Log daily operating expenses outside of food sales.

**Inputs:** Date, category, amount, description, staff_id.

**Outputs:** `expenses` table row.

**Business rules:**
- Date is stored as a TEXT field (YYYY-MM-DD) — not a DATETIME
- Category is free-text — no enforced taxonomy
- No constraint on amount being positive — negative adjustments are theoretically possible but not exposed in the UI

---

## 14. KDS (Kitchen Display Screen)

**Purpose:** Show pending order items on a dedicated kitchen display without printing paper slips.

**Inputs:** Order item ID; preparation status update payload.

**Outputs:** `order_items.preparation_status` updated; KDS screen reflects changes in real time.

**Business rules:**
- KDS reads all order items with `status != 'billed'` and `status != 'cancelled'` grouped by order
- Preparation status per item: `pending` → `preparing` → `ready` → `served`
- `prepared_at` and `served_at` timestamps are written on status transitions
- KDS updates are driven by the renderer polling or IPC push — no WebSocket; polling interval is a frontend concern

---

## 15. Settings & Backup

**Purpose:** Configure outlet identity and manage database backups.

**Inputs:** Outlet name, address, GSTIN, printer settings; backup file path.

**Outputs:** Settings persisted in `electron-store`; database file copied to/from chosen path.

**Business rules:**
- All settings live in `electron-store` — not in SQLite
- Settings are loaded on app start and injected into bill printing
- Export backup: WAL checkpoint (`PRAGMA wal_checkpoint(TRUNCATE)`) then `fs.copyFileSync`
- Import backup: close DB connection → copy current DB to `.bak` → copy new file in → reopen connection
- On import failure: restore from `.bak` automatically; surface error to user
- Import is irreversible from the user's perspective — the `.bak` auto-restore is silent

**Edge cases:**
- Import of a corrupt file: `better-sqlite3` throws on open; `.bak` is restored
- Export while orders are being written: WAL checkpoint flushes pending writes before copy — no partial-write risk
- GSTIN left blank: legal for unregistered businesses; bill prints without a GSTIN line
