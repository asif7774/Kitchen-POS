export interface Table {
  id: number;
  name: string;
  capacity: number;
  section: string;
  status?: 'available' | 'occupied' | 'bill_requested';
}

export interface Category {
  id: number;
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
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  note: string;
}

export interface Staff {
  id: number;
  name: string;
  role: string;
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
  status: 'open' | 'kot_sent' | 'billed' | 'cancelled';
  covers: number;
  note: string | null;
  created_at: string;
  updated_at: string;
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
