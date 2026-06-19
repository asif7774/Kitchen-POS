CREATE TABLE IF NOT EXISTS business_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_date TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  status TEXT CHECK(status IN ('open','closed')) DEFAULT 'open',
  started_by INTEGER REFERENCES staff(id),
  closed_by INTEGER REFERENCES staff(id),
  notes TEXT
);

-- Enforce at most one open session at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_sessions_one_open
  ON business_sessions (status) WHERE status = 'open';

ALTER TABLE orders ADD COLUMN business_date TEXT;
ALTER TABLE bills  ADD COLUMN business_date TEXT;
