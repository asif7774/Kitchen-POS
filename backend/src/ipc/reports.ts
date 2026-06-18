import { ipcMain } from 'electron';
import { getDB } from '../db';

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

interface HourlyRow {
  hour_num: string;
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
  ipcMain.handle('reports:daily', async (_, payload: DailyReportPayload) => {
    try {
      const db = getDB();
      
      // 1. Get aggregate totals
      const aggregates = db.prepare(`
        SELECT 
          COUNT(id) AS total_orders,
          COALESCE(SUM(total_amount), 0) AS total_revenue,
          COALESCE(SUM(cgst_amount), 0) AS total_cgst,
          COALESCE(SUM(sgst_amount), 0) AS total_sgst
        FROM bills
        WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
      `).get(payload.start, payload.end) as AggregateRow | undefined;

      // 2. Get hourly breakdown
      const hourlyRaw = db.prepare(`
        SELECT 
          strftime('%H', created_at) AS hour_num,
          COUNT(id) AS orders_count,
          COALESCE(SUM(total_amount), 0) AS revenue_sum
        FROM bills
        WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
        GROUP BY hour_num
        ORDER BY hour_num ASC
      `).all(payload.start, payload.end) as HourlyRow[];

      const hourlyData = hourlyRaw.map(row => ({
        hour: formatHour(row.hour_num),
        orders: row.orders_count,
        revenue: row.revenue_sum
      }));

      return {
        success: true,
        data: {
          date: payload.start,
          totalOrders: aggregates?.total_orders ?? 0,
          totalRevenue: aggregates?.total_revenue ?? 0,
          totalCGST: aggregates?.total_cgst ?? 0,
          totalSGST: aggregates?.total_sgst ?? 0,
          hourlyData
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

  ipcMain.handle('reports:getPastOrders', async (_, payload: { filter: 'daily' | 'weekly' | 'monthly' | 'yearly' }) => {
    try {
      const db = getDB();
      let modifiers = "";
      
      switch (payload.filter) {
        case 'daily': modifiers = "'localtime', 'start of day'"; break;
        case 'weekly': modifiers = "'localtime', '-6 days', 'start of day'"; break;
        case 'monthly': modifiers = "'localtime', 'start of month'"; break;
        case 'yearly': modifiers = "'localtime', 'start of year'"; break;
      }
      
      const orders = db.prepare(`
        SELECT 
          o.id as order_id, 
          o.created_at as order_time, 
          b.created_at as bill_time, 
          b.total_amount, 
          c.name as customer_name
        FROM orders o
        JOIN bills b ON o.id = b.order_id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.status = 'billed' AND o.created_at >= datetime('now', ${modifiers})
        ORDER BY o.created_at DESC
      `).all() as any[];

      const aggregates = db.prepare(`
        SELECT 
          COUNT(id) AS total_orders,
          COALESCE(SUM(total_amount), 0) AS total_revenue
        FROM bills
        WHERE created_at >= datetime('now', ${modifiers})
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
          orders: data
        }
      };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });
}
