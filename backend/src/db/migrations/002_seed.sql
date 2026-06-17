-- DEFAULT PIN IS 1234 — CHANGE IMMEDIATELY
INSERT OR IGNORE INTO staff (id, name, pin, role) VALUES (1, 'Admin', '$2b$10$PLACEHOLDER', 'admin');

INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES
(1, 'Starters', 1),
(2, 'Main Course', 2),
(3, 'Beverages', 3),
(4, 'Desserts', 4);

INSERT OR IGNORE INTO menu_items (id, category_id, name, price, cgst_rate, sgst_rate, is_veg) VALUES
(1, 1, 'Paneer Tikka', 250.0, 2.5, 2.5, 1),
(2, 1, 'Chicken 65', 300.0, 2.5, 2.5, 0),
(3, 1, 'Gobi Manchurian', 200.0, 2.5, 2.5, 1),
(4, 2, 'Butter Chicken', 400.0, 2.5, 2.5, 0),
(5, 2, 'Palak Paneer', 350.0, 2.5, 2.5, 1),
(6, 2, 'Dal Makhani', 280.0, 2.5, 2.5, 1),
(7, 3, 'Masala Chai', 80.0, 2.5, 2.5, 1),
(8, 3, 'Fresh Lime Soda', 120.0, 2.5, 2.5, 1),
(9, 3, 'Craft Beer', 500.0, 9.0, 9.0, 1),
(10, 4, 'Gulab Jamun', 150.0, 2.5, 2.5, 1),
(11, 4, 'Rasmalai', 180.0, 2.5, 2.5, 1),
(12, 4, 'Chocolate Brownie', 220.0, 2.5, 2.5, 1);

INSERT OR IGNORE INTO tables (id, name) VALUES
(1, 'T1'), (2, 'T2'), (3, 'T3'), (4, 'T4'), (5, 'T5'),
(6, 'T6'), (7, 'T7'), (8, 'T8'), (9, 'T9'), (10, 'T10');
