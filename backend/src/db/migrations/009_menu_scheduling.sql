ALTER TABLE menus ADD COLUMN auto_enable_time TEXT;
ALTER TABLE menus ADD COLUMN auto_disable_time TEXT;
ALTER TABLE menus ADD COLUMN schedule_enabled INTEGER DEFAULT 0;
