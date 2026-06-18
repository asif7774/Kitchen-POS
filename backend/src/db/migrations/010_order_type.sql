ALTER TABLE orders ADD COLUMN type TEXT CHECK(type IN ('dine-in','takeaway','delivery')) DEFAULT 'dine-in';
