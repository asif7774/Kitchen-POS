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
