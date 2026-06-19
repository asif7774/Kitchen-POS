# Kitchen POS — Data Model Reference

Full database schema with field descriptions, relationships, constraints, and design decisions. The database is SQLite running in WAL mode. Schema is managed via numbered migration files in `backend/src/db/migrations/`.

---

## Tables

### `staff`

Stores all staff accounts. PINs are bcrypt-hashed — never stored as plaintext.

```sql
CREATE TABLE IF NOT EXISTS staff (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  pin        TEXT NOT NULL,
  role       TEXT CHECK(role IN ('admin','manager','cashier','waiter')) DEFAULT 'waiter',
  is_active  INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `name` | TEXT | Display name of the staff member |
| `pin` | TEXT | bcrypt hash of the 4-digit PIN |
| `role` | TEXT | Access level: `admin`, `manager`, `cashier`, `waiter` |
| `is_active` | INTEGER | `1` = active (can log in), `0` = deactivated |
| `created_at` | DATETIME | Record creation timestamp |

**Design decisions:**
- Deactivation (`is_active = 0`) is used instead of deletion to preserve historical order links
- PIN lockout is tracked in `electron-store`, not in this table, to avoid DB writes on every failed attempt

---

### `categories`

Menu categories. Each category belongs to one menu via `menu_id`.

```sql
CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active  INTEGER DEFAULT 1,
  menu_id    INTEGER DEFAULT 1
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `name` | TEXT | Category display name (e.g. "Starters", "Beverages") |
| `sort_order` | INTEGER | Display order within the menu |
| `is_active` | INTEGER | `1` = visible, `0` = hidden |
| `menu_id` | INTEGER | Foreign reference to `menus.id` (added in migration 008) |

---

### `menu_items`

Individual food or beverage items. Tax rates are stored per item so each item can have different GST treatment.

```sql
CREATE TABLE IF NOT EXISTS menu_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id  INTEGER REFERENCES categories(id),
  name         TEXT NOT NULL,
  price        REAL NOT NULL,
  cgst_rate    REAL DEFAULT 0,
  sgst_rate    REAL DEFAULT 0,
  hsn_code     TEXT,
  is_veg       INTEGER DEFAULT 1,
  is_available INTEGER DEFAULT 1,
  sort_order   INTEGER DEFAULT 0,
  image_url    TEXT
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `category_id` | INTEGER | Foreign reference to `categories.id` |
| `name` | TEXT | Item display name |
| `price` | REAL | Selling price (inclusive of GST or exclusive — depends on outlet config) |
| `cgst_rate` | REAL | Central GST rate as a percentage (e.g. `9.0` for 9%) |
| `sgst_rate` | REAL | State GST rate as a percentage |
| `hsn_code` | TEXT | Harmonised System of Nomenclature code — required for GST billing |
| `is_veg` | INTEGER | `1` = vegetarian, `0` = non-vegetarian |
| `is_available` | INTEGER | `1` = shown on order screen, `0` = hidden |
| `sort_order` | INTEGER | Display order within the category |
| `image_url` | TEXT | Path to item image file in user data directory |

**Design decisions:**
- Rates stored per item allow different GST treatment for different food types (e.g. 5% for food, 18% for alcohol)
- `is_available` toggling takes effect immediately — no order restart needed
- Changing price or tax rates here does NOT affect historical `order_items` (which snapshot at order time)

---

### `menus`

Named menus that group categories. Supports multiple menus (e.g. Dine-In, Takeaway, Breakfast).

```sql
CREATE TABLE IF NOT EXISTS menus (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT NOT NULL,
  is_active         INTEGER DEFAULT 1,
  is_default        INTEGER DEFAULT 0,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  auto_enable_time  TEXT,    -- 'HH:MM' format
  auto_disable_time TEXT,
  schedule_enabled  INTEGER DEFAULT 0
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `name` | TEXT | Menu display name |
| `is_active` | INTEGER | Whether the menu is in use |
| `is_default` | INTEGER | `1` = loaded by default on order screen |
| `auto_enable_time` | TEXT | Time to activate this menu automatically (HH:MM) |
| `auto_disable_time` | TEXT | Time to deactivate this menu automatically (HH:MM) |
| `schedule_enabled` | INTEGER | `1` = time-based switching is active for this menu |

---

### `tables`

Physical restaurant tables. Status is derived from order state, not stored here.

```sql
CREATE TABLE IF NOT EXISTS tables (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL,
  capacity INTEGER DEFAULT 4,
  section  TEXT DEFAULT 'Main'
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `name` | TEXT | Display name (e.g. "T1", "Outdoor 3") |
| `capacity` | INTEGER | Maximum seating capacity (informational only) |
| `section` | TEXT | Section grouping for the floor plan (e.g. "Main Hall", "Outdoor") |

**Design decision:** Status (`available` / `occupied` / `bill_requested`) is computed at query time by joining with `orders`. This avoids stale status from crashes or missed updates.

---

### `orders`

One record per order (dine-in, takeaway, or delivery). Linked to a table and optionally to a customer.

```sql
CREATE TABLE IF NOT EXISTS orders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id      INTEGER REFERENCES tables(id),
  staff_id      INTEGER REFERENCES staff(id),
  status        TEXT CHECK(status IN ('open','kot_sent','billed','cancelled')) DEFAULT 'open',
  covers        INTEGER DEFAULT 1,
  note          TEXT,
  customer_id   INTEGER REFERENCES customers(id),
  type          TEXT CHECK(type IN ('dine-in','takeaway','delivery')) DEFAULT 'dine-in',
  business_date TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `table_id` | INTEGER | The table this order is for |
| `staff_id` | INTEGER | Staff member who created the order |
| `status` | TEXT | `open` → `kot_sent` → `billed` (or `cancelled`) |
| `covers` | INTEGER | Number of guests |
| `note` | TEXT | General kitchen note for the order |
| `customer_id` | INTEGER | Optional linked customer |
| `type` | TEXT | `dine-in`, `takeaway`, or `delivery` |
| `business_date` | TEXT | YYYY-MM-DD from the active business session at creation time |
| `created_at` | DATETIME | When the order was created |
| `updated_at` | DATETIME | Last modification timestamp |

---

### `order_items`

Individual line items within an order. All price and tax data is **snapshotted at insert time**.

```sql
CREATE TABLE IF NOT EXISTS order_items (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id           INTEGER REFERENCES orders(id),
  menu_item_id       INTEGER REFERENCES menu_items(id),
  name               TEXT NOT NULL,
  qty                INTEGER NOT NULL,
  unit_price         REAL NOT NULL,
  cgst_rate          REAL NOT NULL,
  sgst_rate          REAL NOT NULL,
  hsn_code           TEXT,
  discount           REAL DEFAULT 0,
  kot_printed        INTEGER DEFAULT 0,
  note               TEXT,
  preparation_status TEXT CHECK(preparation_status IN ('pending','preparing','ready','served')) DEFAULT 'pending',
  prepared_at        DATETIME,
  served_at          DATETIME
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `order_id` | INTEGER | Parent order |
| `menu_item_id` | INTEGER | Source menu item (soft reference — item may be deleted) |
| `name` | TEXT | **Snapshot** of item name at order time |
| `qty` | INTEGER | Quantity ordered |
| `unit_price` | REAL | **Snapshot** of price at order time |
| `cgst_rate` | REAL | **Snapshot** of CGST rate at order time |
| `sgst_rate` | REAL | **Snapshot** of SGST rate at order time |
| `hsn_code` | TEXT | **Snapshot** of HSN code at order time |
| `discount` | REAL | Per-item discount amount |
| `kot_printed` | INTEGER | `0` = not yet sent to kitchen, `1` = sent |
| `note` | TEXT | Per-item kitchen instruction |
| `preparation_status` | TEXT | KDS status: `pending` → `preparing` → `ready` → `served` |
| `prepared_at` | DATETIME | When status changed to `ready` |
| `served_at` | DATETIME | When status changed to `served` |

**Critical design decision:** Price, tax rates, and HSN code are snapshotted at order time. Changing a menu item's price or GST rate after an order is placed does not alter that order. This is required for GST audit compliance — historical bills must always be reproducible with the exact figures used at the time.

---

### `payments`

Payment records for a billed order. One row per payment method used.

```sql
CREATE TABLE IF NOT EXISTS payments (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id),
  method   TEXT CHECK(method IN ('cash','card','upi','complimentary','unpaid')),
  amount   REAL NOT NULL,
  reference TEXT,
  paid_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `order_id` | INTEGER | The order being paid |
| `method` | TEXT | Payment method |
| `amount` | REAL | Amount paid via this method |
| `reference` | TEXT | Optional: UPI transaction ID or card last 4 digits |
| `paid_at` | DATETIME | Payment timestamp |

**Note on `unpaid`:** This method records credit extended to a customer. It increments `customers.outstanding_balance` and is settled separately via `customers:settleBalance`.

---

### `bills`

One bill record per completed order. Stores pre-computed GST totals for fast reporting.

```sql
CREATE TABLE IF NOT EXISTS bills (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_number     TEXT NOT NULL UNIQUE,
  order_id        INTEGER REFERENCES orders(id),
  taxable_amount  REAL NOT NULL,
  cgst_amount     REAL NOT NULL,
  sgst_amount     REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  total_amount    REAL NOT NULL,
  customer_id     INTEGER REFERENCES customers(id),
  business_date   TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `bill_number` | TEXT | Sequential invoice number (INV-YYYY-XXXX) — UNIQUE constraint |
| `order_id` | INTEGER | Source order |
| `taxable_amount` | REAL | Total pre-tax amount |
| `cgst_amount` | REAL | Total CGST collected |
| `sgst_amount` | REAL | Total SGST collected |
| `discount_amount` | REAL | Total discount applied |
| `total_amount` | REAL | Grand total (taxable + CGST + SGST − discount) |
| `customer_id` | INTEGER | Optional linked customer |
| `business_date` | TEXT | Business day (from session) for day-end reporting |
| `created_at` | DATETIME | Bill creation timestamp |

**Bill number design:** The sequential counter (`last_bill_number`) lives in `electron-store`, not in SQLite. It is incremented before the DB transaction begins. If the transaction rolls back, the counter is not decremented — gaps are possible after crashes but the sequence is always monotonically increasing.

---

### `inventory_items`

Ingredients and supplies tracked in stock.

```sql
CREATE TABLE IF NOT EXISTS inventory_items (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT NOT NULL,
  unit               TEXT NOT NULL,
  qty_in_stock       REAL DEFAULT 0,
  low_stock_alert_at REAL DEFAULT 0,
  cost_per_unit      REAL DEFAULT 0
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `name` | TEXT | Item name (e.g. "Tomatoes", "Cooking Oil") |
| `unit` | TEXT | Unit of measure (e.g. "kg", "litre", "piece") |
| `qty_in_stock` | REAL | Current stock level |
| `low_stock_alert_at` | REAL | Alert threshold — dashboard highlights when `qty_in_stock <= this` |
| `cost_per_unit` | REAL | Purchase cost per unit (for costing reports) |

---

### `menu_inventory_map`

Links menu items to the inventory ingredients they consume. No primary key — composite relationship table.

```sql
CREATE TABLE IF NOT EXISTS menu_inventory_map (
  menu_item_id      INTEGER REFERENCES menu_items(id),
  inventory_item_id INTEGER REFERENCES inventory_items(id),
  qty_used          REAL NOT NULL
);
```

| Field | Type | Description |
|---|---|---|
| `menu_item_id` | INTEGER | The menu item that consumes the ingredient |
| `inventory_item_id` | INTEGER | The inventory ingredient consumed |
| `qty_used` | REAL | Quantity consumed per single unit of the menu item sold |

**Example:** A "Masala Dosa" (menu_item_id=5) uses 0.1 kg of "Rice Batter" (inventory_item_id=3). When 2 Masala Dosas are billed, 0.2 kg is deducted from Rice Batter.

---

### `inventory_log`

Append-only audit trail of every stock movement.

```sql
CREATE TABLE IF NOT EXISTS inventory_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id    INTEGER REFERENCES inventory_items(id),
  type       TEXT CHECK(type IN ('purchase','sale','adjustment','wastage')),
  qty_change REAL NOT NULL,
  note       TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `item_id` | INTEGER | The inventory item affected |
| `type` | TEXT | Movement type |
| `qty_change` | REAL | Positive = stock in, negative = stock out |
| `note` | TEXT | Optional reason or context |
| `created_at` | DATETIME | When the movement occurred |

---

### `shifts`

Staff shift records for cash tracking and time reporting.

```sql
CREATE TABLE IF NOT EXISTS shifts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id     INTEGER REFERENCES staff(id),
  opened_at    DATETIME,
  closed_at    DATETIME,
  opening_cash REAL DEFAULT 0,
  closing_cash REAL DEFAULT 0,
  note         TEXT
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `staff_id` | INTEGER | Staff member who opened the shift |
| `opened_at` | DATETIME | Shift start time |
| `closed_at` | DATETIME | Shift end time (`NULL` while open) |
| `opening_cash` | REAL | Cash in drawer at shift start |
| `closing_cash` | REAL | Cash in drawer at shift end |
| `note` | TEXT | Optional notes on close |

---

### `business_sessions`

Defines the boundaries of each business day for reporting purposes.

```sql
CREATE TABLE IF NOT EXISTS business_sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  business_date TEXT NOT NULL,
  started_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at     DATETIME,
  status        TEXT CHECK(status IN ('open','closed')) DEFAULT 'open',
  started_by    INTEGER REFERENCES staff(id),
  closed_by     INTEGER REFERENCES staff(id),
  notes         TEXT
);

-- Only one open session at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_sessions_one_open
  ON business_sessions (status) WHERE status = 'open';
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `business_date` | TEXT | YYYY-MM-DD — the date this session represents |
| `started_at` | DATETIME | When the session was opened |
| `closed_at` | DATETIME | When the session was closed (`NULL` while open) |
| `status` | TEXT | `open` or `closed` |
| `started_by` | INTEGER | Admin who opened the session |
| `closed_by` | INTEGER | Admin who closed the session |
| `notes` | TEXT | Optional closing notes |

**Key constraint:** A partial unique index on `(status) WHERE status = 'open'` ensures only one session can be open at any time. Attempting to insert a second open session throws a unique constraint violation.

---

### `customers`

Customer registry with balance and loyalty tracking.

```sql
CREATE TABLE IF NOT EXISTS customers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT NOT NULL,
  phone               TEXT UNIQUE,
  email               TEXT,
  loyalty_points      INTEGER DEFAULT 0,
  total_visits        INTEGER DEFAULT 0,
  credit_limit        REAL DEFAULT 0,
  outstanding_balance REAL DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `name` | TEXT | Customer display name |
| `phone` | TEXT | Phone number — UNIQUE constraint |
| `email` | TEXT | Email address (optional) |
| `loyalty_points` | INTEGER | Accumulated loyalty points |
| `total_visits` | INTEGER | Number of billed orders linked to this customer |
| `credit_limit` | REAL | Maximum credit allowed (informational — not enforced by DB) |
| `outstanding_balance` | REAL | Unpaid amount owed by the customer |

---

### `expenses`

Daily operating expense log.

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL,
  category    TEXT NOT NULL,
  amount      REAL NOT NULL,
  description TEXT,
  staff_id    INTEGER REFERENCES staff(id),
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-incrementing primary key |
| `date` | TEXT | YYYY-MM-DD — the date the expense occurred |
| `category` | TEXT | Free-text category (e.g. "Groceries", "Utilities") |
| `amount` | REAL | Expense amount |
| `description` | TEXT | Optional details |
| `staff_id` | INTEGER | Staff member who logged the expense |
| `created_at` | TEXT | Record creation timestamp |

---

## Non-Database Persistence (electron-store)

Some data lives outside SQLite in `electron-store` (a JSON file in the OS user data directory).

| Key | Type | Description |
|---|---|---|
| `last_bill_number` | number | Sequential counter for INV-YYYY-XXXX bill numbers |
| `outletName` | string | Restaurant name — printed on every bill |
| `outletAddress` | string | Restaurant address — printed on every bill |
| `gstin` | string | GST Identification Number — printed on every bill |
| `printer_*` | various | USB printer configuration (port, baud rate, etc.) |
| `autoBackup.*` | object | Auto-backup enabled flag, path, and frequency |
| `failed_attempts_<id>` | object | PIN failure tracking per staff ID for lockout |
| `setup_complete` | boolean | Whether initial first-run setup is done |

---

## Design Decisions

**Why snapshot price and tax on `order_items`?**
GST law requires that historical invoices are reproducible with the exact figures used at the time of sale. If live rates were looked up from `menu_items`, a price change would silently alter the effective tax on all open orders. Snapshotting makes each order_item a self-contained record.

**Why is `last_bill_number` in electron-store and not SQLite?**
Bill number generation must be atomic with the DB transaction that creates the bill. Using electron-store avoids a SELECT + UPDATE race condition. The trade-off is that a counter increment is not rolled back if the DB transaction fails — gaps are acceptable; out-of-order numbers are not.

**Why WAL mode?**
Write-Ahead Logging allows concurrent reads during writes. In a restaurant environment, reports may be pulled while orders are being processed. WAL eliminates the read lock contention that would occur in the default journal mode. WAL also provides better crash recovery than DELETE journal mode.

**Why `better-sqlite3` (synchronous) over async SQLite drivers?**
The Electron main process runs on a single Node.js thread. Synchronous DB calls are simpler, eliminate callback/Promise complexity in IPC handlers, and perform better for the query volumes a single-terminal POS generates. The renderer is never blocked because IPC is always asynchronous from the renderer's perspective.
