const Database = require('better-sqlite3');
const dbPath = require('os').homedir() + '/Library/Application Support/restaurant-pos/pos.db';
const db = new Database(dbPath);

try {
  // Test 1: getMenus
  const menus = db.prepare('SELECT * FROM menus').all();
  console.log('getMenus:', menus);

  // Test 2: getByTable
  const order = db.prepare(`
    SELECT o.*, c.name as customer_name 
    FROM orders o 
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.table_id = ? AND o.status != 'billed' AND o.status != 'cancelled'
    LIMIT 1
  `).get(1);
  console.log('getByTable order:', order);
  
  if (order) {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    console.log('getByTable items:', items);
  }

  // Test 3: menu getAll
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 AND menu_id = ? ORDER BY sort_order ASC').all(1);
  console.log('categories:', categories);
  
  for (const c of categories) {
    const items = db.prepare('SELECT * FROM menu_items WHERE category_id = ? AND is_available = 1 ORDER BY sort_order ASC').all(c.id);
    console.log(`items for cat ${c.id}:`, items.length);
  }
} catch (e) {
  console.error(e);
}
