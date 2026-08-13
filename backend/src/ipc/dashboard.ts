import { ipcMain } from 'electron';
import { getDB } from '../db';

import { getDateConditions, calcTrend } from './utils/date-utils';

export function registerDashboardIPC() {
  ipcMain.handle('dashboard:getMetrics', async (_event, payload: { filter: string }) => {
    try {
      const db = getDB();
      const filter = payload.filter; // 'today', 'yesterday', 'weekly', 'monthly', 'yearly'
      
      const activeBizRow = db.prepare(
        "SELECT business_date FROM business_sessions WHERE status = 'open' LIMIT 1"
      ).get() as { business_date: string } | undefined;
      const activeBizDate = activeBizRow?.business_date ?? null;

      const { curr: dateCondition, prev: prevDateCondition, format: trendGroupFormat } = getDateConditions(filter, activeBizDate);

      // Derive SQL label expression for trend grouping
      let labelExpr: string;
      if (trendGroupFormat === '%H') {
        labelExpr = "strftime('%H', bills.created_at, 'localtime')";
      } else if (trendGroupFormat === '%Y-%m') {
        labelExpr = "substr(bills.business_date, 1, 7)";
      } else {
        labelExpr = 'bills.business_date';
      }

      // Qualified conditions for queries that JOIN bills + orders (both have business_date)
      const billsDateCondition = dateCondition.replace(/business_date/g, 'bills.business_date');
      const ordersDateCondition = dateCondition.replace(/business_date/g, 'o.business_date');

      // 1. Total Sales
      const salesQuery = db.prepare(`SELECT SUM(total_amount) as total FROM bills WHERE ${dateCondition}`).get() as { total: number | null };
      const totalSales = salesQuery.total ?? 0;

      const prevSalesQuery = db.prepare(`SELECT SUM(total_amount) as total FROM bills WHERE ${prevDateCondition}`).get() as { total: number | null };
      const prevTotalSales = prevSalesQuery.total ?? 0;

      // 2. Number of Orders
      const ordersQuery = db.prepare(`SELECT COUNT(id) as count, SUM(covers) as covers FROM orders WHERE ${dateCondition}`).get() as { count: number, covers: number | null };
      const totalOrders = ordersQuery.count;

      const prevOrdersQuery = db.prepare(`SELECT COUNT(id) as count, SUM(covers) as covers FROM orders WHERE ${prevDateCondition}`).get() as { count: number, covers: number | null };
      const prevTotalOrders = prevOrdersQuery.count;
      
      // 3. Customers Served
      const totalCustomers = ordersQuery.covers ?? 0;
      const prevTotalCustomers = prevOrdersQuery.covers ?? 0;

      // 4. Average Order Value
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      const prevAverageOrderValue = prevTotalOrders > 0 ? prevTotalSales / prevTotalOrders : 0;

      // 5. Outstanding Balances (Global sum from customers)
      const balancesQuery = db.prepare(`SELECT SUM(outstanding_balance) as total FROM customers`).get() as { total: number | null };
      const outstandingBalances = balancesQuery.total ?? 0;

      // 6. Sales Trend (Line Chart Data)
      const trendQuery = db.prepare(`
        SELECT
          ${labelExpr} as label,
          SUM(bills.total_amount) as sales,
          COUNT(bills.id) as orders,
          SUM(orders.covers) as customers
        FROM bills
        JOIN orders ON bills.order_id = orders.id
        WHERE ${billsDateCondition}
        GROUP BY label
        ORDER BY label ASC
      `).all() as { label: string, sales: number, orders: number, customers: number }[];

      // 7. Top Selling Items (Bar/Pie Chart Data)
      const topItemsQuery = db.prepare(`
        SELECT
          oi.name,
          SUM(oi.qty) as quantity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE ${ordersDateCondition}
        GROUP BY oi.menu_item_id, oi.name
        ORDER BY quantity DESC
        LIMIT 5
      `).all() as { name: string, quantity: number }[];

      // 8. Peak Hourly Traffic (Summed by hour across the entire period)
      const peakHourQuery = db.prepare(`
        SELECT
          strftime('%H', bills.created_at, 'localtime') as hour,
          SUM(bills.total_amount) as revenue,
          COUNT(bills.id) as orders,
          SUM(orders.covers) as customers
        FROM bills
        JOIN orders ON bills.order_id = orders.id
        WHERE ${billsDateCondition}
        GROUP BY hour
        ORDER BY hour ASC
      `).all() as { hour: string, revenue: number, orders: number, customers: number }[];

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
          trends: {
            totalSales: calcTrend(totalSales, prevTotalSales),
            totalOrders: calcTrend(totalOrders, prevTotalOrders),
            averageOrderValue: calcTrend(averageOrderValue, prevAverageOrderValue),
            totalCustomers: calcTrend(totalCustomers, prevTotalCustomers),
            outstandingBalances: null
          },
          trendData: trendQuery,
          topItemsData: topItemsQuery,
          peakHourData: peakHourQuery
        }
      };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });
}
