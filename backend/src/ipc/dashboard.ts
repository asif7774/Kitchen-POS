import { ipcMain } from 'electron';
import { getDB } from '../db';

export function registerDashboardIPC() {
  ipcMain.handle('dashboard:getMetrics', async (_event, payload: { filter: string }) => {
    try {
      const db = getDB();
      const filter = payload.filter; // 'today', 'yesterday', 'weekly', 'monthly', 'yearly'
      
      let dateCondition = '';
      let trendGroupFormat = '';

      switch (filter) {
        case 'today':
          dateCondition = "date(created_at, 'localtime') = date('now', 'localtime')";
          trendGroupFormat = "%H"; // Group by hour
          break;
        case 'yesterday':
          dateCondition = "date(created_at, 'localtime') = date('now', '-1 day', 'localtime')";
          trendGroupFormat = "%H";
          break;
        case 'weekly':
          dateCondition = "date(created_at, 'localtime') >= date('now', '-6 days', 'localtime')";
          trendGroupFormat = "%Y-%m-%d"; // Group by day
          break;
        case 'monthly':
          dateCondition = "strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')";
          trendGroupFormat = "%Y-%m-%d";
          break;
        default:
          dateCondition = "date(created_at, 'localtime') = date('now', 'localtime')";
          trendGroupFormat = "%H";
      }

      // 1. Total Sales
      const salesQuery = db.prepare(`SELECT SUM(total_amount) as total FROM bills WHERE ${dateCondition.replace(/created_at/g, 'created_at')}`).get() as { total: number | null };
      const totalSales = salesQuery.total ?? 0;

      // 2. Number of Orders
      const ordersQuery = db.prepare(`SELECT COUNT(id) as count, SUM(covers) as covers FROM orders WHERE ${dateCondition.replace(/created_at/g, 'created_at')}`).get() as { count: number, covers: number | null };
      const totalOrders = ordersQuery.count;
      
      // 3. Customers Served
      const totalCustomers = ordersQuery.covers ?? 0;

      // 4. Average Order Value
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // 5. Outstanding Balances (Global sum from customers)
      const balancesQuery = db.prepare(`SELECT SUM(outstanding_balance) as total FROM customers`).get() as { total: number | null };
      const outstandingBalances = balancesQuery.total ?? 0;

      // 6. Sales Trend (Line Chart Data)
      const trendQuery = db.prepare(`
        SELECT 
          strftime('${trendGroupFormat}', created_at, 'localtime') as label, 
          SUM(total_amount) as sales,
          COUNT(id) as orders
        FROM bills 
        WHERE ${dateCondition.replace(/created_at/g, 'created_at')}
        GROUP BY label
        ORDER BY label ASC
      `).all() as { label: string, sales: number, orders: number }[];

      // 7. Top Selling Items (Bar/Pie Chart Data)
      const topItemsQuery = db.prepare(`
        SELECT 
          oi.name, 
          SUM(oi.qty) as quantity 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE ${dateCondition.replace(/created_at/g, 'o.created_at')}
        GROUP BY oi.menu_item_id, oi.name
        ORDER BY quantity DESC
        LIMIT 5
      `).all() as { name: string, quantity: number }[];

      return {
        success: true,
        data: {
          metrics: {
            totalSales,
            totalOrders,
            averageOrderValue,
            totalCustomers,
            outstandingBalances
          },
          trendData: trendQuery,
          topItemsData: topItemsQuery
        }
      };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });
}
