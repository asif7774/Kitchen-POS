const Database = require('better-sqlite3');
const db = new Database('/Users/diaspark/Library/Application Support/restaurant-pos/pos.db');
try {
  db.prepare(`
    SELECT * FROM orders
    WHERE id = ? AND status != 'billed' AND status != 'cancelled'
  `).get(1);
  console.log("query 1 ok");
  
  db.prepare('SELECT menu_item_id, qty FROM order_items WHERE order_id = ?').all(1);
  console.log("query 2 ok");
  
  db.prepare('SELECT inventory_item_id, qty_used FROM menu_inventory_map WHERE menu_item_id = ?').all(1);
  console.log("query 3 ok");
  
  db.prepare('UPDATE inventory_items SET qty_in_stock = qty_in_stock + ? WHERE id = ?').run(1, 1);
  console.log("query 4 ok");
  
  db.prepare('INSERT INTO inventory_log (item_id, type, qty_change, note) VALUES (?, ?, ?, ?)').run(1, 'adjustment', 1, `Order #1 Cancelled`);
  console.log("query 5 ok");
  
  db.prepare('UPDATE orders SET status = "cancelled", note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('', 1);
  console.log("query 6 ok");

} catch(e) {
  console.error(e.message);
}
