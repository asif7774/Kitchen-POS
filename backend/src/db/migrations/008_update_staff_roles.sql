PRAGMA foreign_keys=off;

CREATE TABLE staff_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin','manager','cashier','waiter','chef','cleaner')) DEFAULT 'waiter',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO staff_new (id, name, pin, role, is_active, created_at)
SELECT id, name, pin, role, is_active, created_at FROM staff;

DROP TABLE staff;

ALTER TABLE staff_new RENAME TO staff;

PRAGMA foreign_keys=on;
