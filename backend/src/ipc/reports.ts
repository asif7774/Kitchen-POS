import { ipcMain } from 'electron';
import Store from 'electron-store';
import { getDB } from '../db';
import { printBill } from '../services/printer';

interface DailyReportPayload {
  start: string;
  end: string;
}

interface AggregateRow {
  total_orders: number;
  total_revenue: number;
  total_cgst: number;
  total_sgst: number;
}

interface TrendRow {
  label: string;
  orders_count: number;
  revenue_sum: number;
}

function formatHour(hourStr: string): string {
  const hour = parseInt(hourStr, 10);
  if (hour === 0) {return '12 AM';}
  if (hour === 12) {return '12 PM';}
  if (hour > 12) {return `${hour - 12} PM`;}
  return `${hour} PM`; // Default fallback, but PM for afternoon hours
}

export function registerReportsIPC() {
  ipcMain.handle('reports:daily', async (_, payload: { filter: string, start?: string, end?: string }) => {
    try {
      const db = getDB();
      const filter = payload.filter;

      let dateCondition = '';
      let trendGroupFormat = '';
      const params: any[] = [];

      switch (filter) {
        case 'daily':
        case 'today':
          dateCondition = "date(created_at, 'localtime') = date('now', 'localtime')";
          trendGroupFormat = "%H"; // Group by hour
          break;
        case 'weekly':
          dateCondition = "date(created_at, 'localtime') >= date('now', '-6 days', 'localtime')";
          trendGroupFormat = "%Y-%m-%d"; // Group by day
          break;
        case 'monthly':
          dateCondition = "strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')";
          trendGroupFormat = "%Y-%m-%d";
          break;
        case 'yearly':
          dateCondition = "strftime('%Y', created_at, 'localtime') = strftime('%Y', 'now', 'localtime')";
          trendGroupFormat = "%Y-%m"; // Group by month
          break;
        case 'custom':
          dateCondition = "date(created_at, 'localtime') >= date(?) AND date(created_at, 'localtime') <= date(?)";
          params.push(payload.start, payload.end);
          trendGroupFormat = "%Y-%m-%d"; // Group by day
          break;
        default:
          dateCondition = "date(created_at, 'localtime') = date('now', 'localtime')";
          trendGroupFormat = "%H";
      }
      
      // 1. Get aggregate totals
      const aggregates = db.prepare(`
        SELECT 
          COUNT(id) AS total_orders,
          COALESCE(SUM(total_amount), 0) AS total_revenue,
          COALESCE(SUM(cgst_amount), 0) AS total_cgst,
          COALESCE(SUM(sgst_amount), 0) AS total_sgst
        FROM bills
        WHERE ${dateCondition}
      `).get(...params) as AggregateRow | undefined;

      // 2. Get trend breakdown
      const trendRaw = db.prepare(`
        SELECT 
          strftime('${trendGroupFormat}', created_at, 'localtime') AS label,
          COUNT(id) AS orders_count,
          COALESCE(SUM(total_amount), 0) AS revenue_sum
        FROM bills
        WHERE ${dateCondition}
        GROUP BY label
        ORDER BY label ASC
      `).all(...params) as TrendRow[];

      const trendData = trendRaw.map(row => ({
        hour: trendGroupFormat === '%H' ? formatHour(row.label) : row.label,
        orders: row.orders_count,
        revenue: row.revenue_sum
      }));

      return {
        success: true,
        data: {
          date: filter,
          totalOrders: aggregates?.total_orders ?? 0,
          totalRevenue: aggregates?.total_revenue ?? 0,
          totalCGST: aggregates?.total_cgst ?? 0,
          totalSGST: aggregates?.total_sgst ?? 0,
          hourlyData: trendData
        }
      };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown reports aggregation error' };
    }
  });

  ipcMain.handle('reports:gst', async () => {
    return { success: true };
  });

  ipcMain.handle('reports:getPastOrders', async (_, payload: { filter: 'daily' | 'weekly' | 'monthly' | 'yearly'; page: number; limit: number }) => {
    try {
      const db = getDB();
      let modifiers = "";
      
      switch (payload.filter) {
        case 'daily': modifiers = "'localtime', 'start of day'"; break;
        case 'weekly': modifiers = "'localtime', '-6 days', 'start of day'"; break;
        case 'monthly': modifiers = "'localtime', 'start of month'"; break;
        case 'yearly': modifiers = "'localtime', 'start of year'"; break;
      }
      
      const { page, limit } = payload;
      const offset = (page - 1) * limit;

      const totalCountRow = db.prepare(`
        SELECT COUNT(DISTINCT o.id) as count
        FROM orders o
        JOIN bills b ON o.id = b.order_id
        WHERE o.status = 'billed' AND datetime(o.created_at, 'localtime') >= datetime('now', ${modifiers})
      `).get() as { count: number };
      const totalOrdersCount = totalCountRow.count;
      const totalPages = Math.ceil(totalOrdersCount / limit);

      const orders = db.prepare(`
        SELECT 
          o.id as order_id, 
          o.created_at as order_time, 
          b.created_at as bill_time, 
          b.total_amount, 
          c.name as customer_name,
          o.type
        FROM orders o
        JOIN bills b ON o.id = b.order_id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.status = 'billed' AND datetime(o.created_at, 'localtime') >= datetime('now', ${modifiers})
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset) as any[];

      const aggregates = db.prepare(`
        SELECT 
          COUNT(DISTINCT b.id) AS total_orders,
          COALESCE(SUM(b.total_amount), 0) AS total_revenue
        FROM bills b
        JOIN orders o ON o.id = b.order_id
        WHERE datetime(o.created_at, 'localtime') >= datetime('now', ${modifiers})
      `).get() as { total_orders: number, total_revenue: number };

      const average_order_value = aggregates.total_orders > 0 
        ? aggregates.total_revenue / aggregates.total_orders 
        : 0;

      const data = orders.map(o => {
        const items = db.prepare('SELECT name, qty FROM order_items WHERE order_id = ?').all(o.order_id);
        const occupiedMs = new Date(o.bill_time).getTime() - new Date(o.order_time).getTime();
        return {
          id: o.order_id,
          amount: o.total_amount,
          customerName: o.customer_name ?? 'Walk-in',
          date: o.order_time,
          occupiedTimeMs: occupiedMs > 0 ? occupiedMs : 0,
          type: o.type,
          items
        };
      });

      return {
        success: true,
        data: {
          stats: {
            totalOrders: aggregates.total_orders,
            totalRevenue: aggregates.total_revenue,
            averageOrderValue: average_order_value
          },
          orders: data,
          totalPages,
          currentPage: page
        }
      };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('reports:printPastBill', async (_, payload: { orderId: number }) => {
    try {
      const db = getDB();
      const bill = db.prepare('SELECT * FROM bills WHERE order_id = ?').get(payload.orderId) as any;
      if (!bill) throw new Error('Bill not found for this order.');

      const items = db.prepare(`
        SELECT name, qty, unit_price 
        FROM order_items 
        WHERE order_id = ?
      `).all(payload.orderId) as any[];

      const store = new Store();
      const settings = {
        outlet_name: store.get('outlet_name') as string,
        address: store.get('address') as string,
        gstin: store.get('gstin') as string,
      };

      await printBill({ ...bill, date: bill.created_at }, items, settings);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown printing error' };
    }
  });
}
