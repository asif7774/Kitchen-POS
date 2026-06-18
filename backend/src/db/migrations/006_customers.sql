CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  credit_limit REAL DEFAULT 0,
  outstanding_balance REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add customer_id to orders
ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id);

-- Add customer_id to bills
ALTER TABLE bills ADD COLUMN customer_id INTEGER REFERENCES customers(id);

-- Update payments check constraint by recreating the table
-- SQLite doesn't support ALTER TABLE ... DROP CONSTRAINT easily
PRAGMA foreign_keys=off;

CREATE TABLE IF NOT EXISTS payments_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id),
  method TEXT CHECK(method IN ('cash','card','upi','complimentary','unpaid')),
  amount REAL NOT NULL,
  reference TEXT,
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payments_new (id, order_id, method, amount, reference, paid_at)
SELECT id, order_id, method, amount, reference, paid_at FROM payments;

DROP TABLE payments;
ALTER TABLE payments_new RENAME TO payments;

PRAGMA foreign_keys=on;
