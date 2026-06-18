-- Add dummy staff members
INSERT OR IGNORE INTO staff (id, name, pin, role) VALUES 
(2, 'John Manager', '2222', 'manager'),
(3, 'Sarah Cashier', '3333', 'cashier'),
(4, 'Mike Waiter', '4444', 'waiter'),
(5, 'Emma Waiter', '5555', 'waiter');

-- Add dummy inventory items
INSERT OR IGNORE INTO inventory_items (id, name, unit, qty_in_stock, low_stock_alert_at, cost_per_unit) VALUES
(1, 'Paneer', 'kg', 15.5, 5.0, 350.0),
(2, 'Chicken', 'kg', 20.0, 10.0, 250.0),
(3, 'Onions', 'kg', 50.0, 15.0, 40.0),
(4, 'Tomatoes', 'kg', 30.0, 10.0, 50.0),
(5, 'Rice', 'kg', 100.0, 20.0, 65.0),
(6, 'Milk', 'L', 25.0, 5.0, 60.0),
(7, 'Tea Leaves', 'kg', 5.0, 1.0, 400.0),
(8, 'Craft Beer Keg', 'L', 100.0, 20.0, 150.0);

-- Map menu items to inventory (dummy data)
INSERT OR IGNORE INTO menu_inventory_map (menu_item_id, inventory_item_id, qty_used) VALUES
(1, 1, 0.2),
(1, 3, 0.1),
(4, 2, 0.3),
(4, 4, 0.15),
(7, 6, 0.1),
(7, 7, 0.01),
(9, 8, 0.5);

-- Add dummy expenses
INSERT OR IGNORE INTO expenses (id, date, category, amount, description, staff_id) VALUES
(1, date('now', '-2 days'), 'Maintenance', 1500.0, 'Plumbing repair for kitchen sink', 1),
(2, date('now', '-1 days'), 'Utilities', 4500.0, 'Electricity bill payment', 1),
(3, date('now'), 'Supplies', 800.0, 'Cleaning supplies', 2),
(4, date('now'), 'Marketing', 2000.0, 'Social media ad boost', 1);

-- Add dummy inventory logs
INSERT OR IGNORE INTO inventory_log (item_id, type, qty_change, note) VALUES
(1, 'purchase', 20.0, 'Initial purchase'),
(1, 'sale', -4.5, 'Sold in dishes'),
(2, 'purchase', 30.0, 'Initial purchase'),
(2, 'sale', -10.0, 'Sold in dishes');
