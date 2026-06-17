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
