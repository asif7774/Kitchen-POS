export interface Table {
  id: number;
  name: string;
  capacity: number;
  section: string;
  custom_name?: string | null;
  status?: 'available' | 'occupied' | 'bill_requested';
}

export interface Menu {
  id: number;
  name: string;
  is_active: number;
  is_default: number;
  auto_enable_time?: string | null;
  auto_disable_time?: string | null;
  schedule_enabled?: number;
}

export interface Category {
  id: number;
  menu_id: number;
  name: string;
  sort_order?: number;
  is_active?: number;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  price: number;
  cgst_rate?: number;
  sgst_rate?: number;
  hsn_code?: string;
  is_veg: number;
  is_available?: number;
  image_url?: string | null;
}

export interface CartItem {
  id: number;
  orderItemId?: number;
  name: string;
  price: number;
  qty: number;
  note: string;
  status?: string;
  originalQty?: number;
  kot_number?: number;
}

export interface Staff {
  id: number;
  name: string;
  role: string;
  is_active: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  qty_in_stock: number;
  low_stock_alert_at: number;
  cost_per_unit: number;
}

export interface InventoryLog {
  id: number;
  item_id: number;
  type: 'purchase' | 'sale' | 'adjustment' | 'wastage';
  qty_change: number;
  note: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  table_id: number;
  staff_id?: number | null;
  customer_id?: number | null;
  customer_name?: string | null;
  status: 'open' | 'kot_sent' | 'billed' | 'cancelled';
  covers: number;
  note: string | null;
  type: 'dine-in' | 'takeaway' | 'delivery';
  created_at: string;
  updated_at: string;
}

export interface PastOrderData {
  id: number;
  amount: number;
  customerName: string;
  date: string;
  business_date: string | null;
  occupiedTimeMs: number;
  type?: 'dine-in' | 'takeaway' | 'delivery';
  items: {
    name: string;
    qty: number;
  }[];
}

export interface PastOrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  name: string;
  qty: number;
  unit_price: number;
  cgst_rate: number;
  sgst_rate: number;
  hsn_code: string | null;
  discount: number;
  kot_printed: number;
  note: string | null;
  preparation_status: 'pending' | 'preparing' | 'ready' | 'served';
  kot_number?: number;
  prepared_at?: string | null;
  served_at?: string | null;
}

export interface KDSTicketItem {
  id: number;
  menu_item_id: number;
  name: string;
  qty: number;
  note: string | null;
  preparation_status: 'pending' | 'preparing' | 'ready' | 'served';
  prepared_at: string | null;
  served_at: string | null;
}

export interface KDSTicket {
  order_id: number;
  table_id: number;
  table_name: string;
  order_note: string | null;
  type: 'dine-in' | 'takeaway' | 'delivery';
  created_at: string;
  updated_at: string;
  items: KDSTicketItem[];
}

export interface Shift {
  id: number;
  staff_id: number;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  closing_cash: number | null;
  note: string | null;
}

export interface RecipeItem {
  inventory_item_id: number;
  qty_used: number;
  name?: string;
  unit?: string;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  description: string | null;
  staff_id: number | null;
  staff_name?: string | null;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  loyalty_points: number;
  total_visits: number;
  credit_limit: number;
  outstanding_balance: number;
  created_at: string;
}

export interface CustomerHistory {
  orderId: number;
  date: string;
  billNumber: string;
  totalAmount: number;
  items: { name: string; qty: number }[];
}

export interface BusinessSession {
  id: number;
  business_date: string;
  started_at: string;
  closed_at: string | null;
  status: 'open' | 'closed';
  started_by: number | null;
  closed_by: number | null;
  notes: string | null;
}

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  path: string | null;
  dayOfWeek: number;
  lastBackupAt: string | null;
}

export interface BackupReminderConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek: number;
  dayOfMonth: number;
  lastRemindedDate: string | null;
}
