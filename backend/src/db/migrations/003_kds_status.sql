-- Alter order_items to support Kitchen Display Screen (KDS) tracking
ALTER TABLE order_items ADD COLUMN preparation_status TEXT CHECK(preparation_status IN ('pending', 'preparing', 'ready', 'served')) DEFAULT 'pending';
ALTER TABLE order_items ADD COLUMN prepared_at DATETIME;
ALTER TABLE order_items ADD COLUMN served_at DATETIME;
