CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default menu if none exists
INSERT INTO menus (name, is_default)
SELECT 'Main Menu', 1
WHERE NOT EXISTS (SELECT 1 FROM menus);

-- Add menu_id to categories
ALTER TABLE categories ADD COLUMN menu_id INTEGER REFERENCES menus(id) DEFAULT 1;

-- Add image_url to menu_items
ALTER TABLE menu_items ADD COLUMN image_url TEXT;
