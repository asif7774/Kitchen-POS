import { Category, MenuItem, InventoryItem, Order, OrderItem, CartItem, KDSTicket, Shift, RecipeItem } from '../types/models';

export interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const ipcApi = (window as unknown as { api: unknown }).api;

const mockApi = {
  orders: {
    create: () => Promise.resolve({ success: true, data: 1 }),
    addItem: () => Promise.resolve({ success: true }),
    updateItem: () => Promise.resolve({ success: true }),
    removeItem: () => Promise.resolve({ success: true }),
    getOpen: () => Promise.resolve({ success: true, data: [] }),
    getByTable: () => Promise.resolve({ success: true, data: null }),
    sendKOT: () => Promise.resolve({ success: true, data: 1 }),
    cancelByTable: () => Promise.resolve({ success: true }),
  },
  kds: {
    getActiveTickets: () => Promise.resolve({ success: true, data: [] }),
    updateItemStatus: () => Promise.resolve({ success: true }),
    updateOrderStatus: () => Promise.resolve({ success: true }),
  },
  menu: {
    getAll: () => Promise.resolve({
      success: true,
      data: [
        {
          id: 1, name: 'Starters', sort_order: 1, is_active: 1,
          items: [
            { id: 101, category_id: 1, name: 'Paneer Tikka', price: 250, is_veg: 1, is_available: 1, cgst_rate: 2.5, sgst_rate: 2.5, hsn_code: '2106' },
            { id: 102, category_id: 1, name: 'Chicken Tikka', price: 350, is_veg: 0, is_available: 1, cgst_rate: 2.5, sgst_rate: 2.5, hsn_code: '2106' },
          ]
        },
        {
          id: 2, name: 'Main Course', sort_order: 2, is_active: 1,
          items: [
            { id: 201, category_id: 2, name: 'Butter Chicken', price: 450, is_veg: 0, is_available: 1, cgst_rate: 2.5, sgst_rate: 2.5, hsn_code: '2106' },
            { id: 202, category_id: 2, name: 'Dal Makhani', price: 300, is_veg: 1, is_available: 1, cgst_rate: 2.5, sgst_rate: 2.5, hsn_code: '2106' },
          ]
        },
        {
          id: 3, name: 'Breads', sort_order: 3, is_active: 1,
          items: [
            { id: 301, category_id: 3, name: 'Garlic Naan', price: 60, is_veg: 1, is_available: 1, cgst_rate: 2.5, sgst_rate: 2.5, hsn_code: '1905' },
            { id: 302, category_id: 3, name: 'Butter Roti', price: 30, is_veg: 1, is_available: 1, cgst_rate: 2.5, sgst_rate: 2.5, hsn_code: '1905' },
          ]
        }
      ]
    }),
    upsertItem: () => Promise.resolve({ success: true, data: { id: 999 } }),
    deleteItem: () => Promise.resolve({ success: true }),
    toggleAvailable: () => Promise.resolve({ success: true }),
    upsertCategory: () => Promise.resolve({ success: true, data: { id: 99 } }),
    deleteCategory: () => Promise.resolve({ success: true }),
    getRecipe: () => Promise.resolve({ success: true, data: [] }),
    updateRecipe: () => Promise.resolve({ success: true }),
  },
  tables: {
    getAll: () => Promise.resolve({
      success: true,
      data: [
        { id: 1, name: 'Table 1', capacity: 4, section: 'Main' },
        { id: 2, name: 'Table 2', capacity: 2, section: 'Main' },
        { id: 3, name: 'Table 3', capacity: 6, section: 'Outdoor' },
      ]
    }),
    upsert: () => Promise.resolve({ success: true }),
    delete: () => Promise.resolve({ success: true }),
  },
  billing: {
    createBill: () => Promise.resolve({ success: true }),
    getBill: () => Promise.resolve({ success: true, data: {} }),
  },
  print: {
    kot: () => Promise.resolve({ success: true }),
    bill: () => Promise.resolve({ success: true }),
  },
  inventory: {
    getAll: () => Promise.resolve({ success: true, data: [] }),
    adjust: () => Promise.resolve({ success: true }),
    upsertItem: () => Promise.resolve({ success: true }),
  },
  staff: {
    login: (payload: { pin: string }) => {
      if (payload.pin === '1234') {
        return Promise.resolve({ success: true, data: { id: 1, name: 'Mock Admin', role: 'admin' } });
      }
      return Promise.resolve({ success: false, error: 'Invalid PIN' });
    },
    getAll: () => Promise.resolve({ success: true, data: [] }),
    upsert: () => Promise.resolve({ success: true }),
  },
  shifts: (() => {
    let activeShift: Shift | null = null;
    return {
      getActive: () => Promise.resolve({ success: true, data: activeShift }),
      open: (_payload: { staffId: number; openingCash: number }) => {
        activeShift = { id: 1, staff_id: _payload.staffId, opened_at: new Date().toISOString(), opening_cash: _payload.openingCash, closed_at: null, closing_cash: null, note: null };
        return Promise.resolve({ success: true, data: { id: 1 } });
      },
      close: (_payload: { shiftId: number; closingCash: number; note?: string }) => {
        activeShift = null;
        return Promise.resolve({ success: true });
      },
      getTotals: (_payload: { openedAt: string }) => Promise.resolve({ success: true, data: { cash: 0, card: 0, upi: 0, complimentary: 0 } }),
    };
  })(),
  reports: {
    daily: () => Promise.resolve({ success: true, data: {} }),
    gst: () => Promise.resolve({ success: true, data: {} }),
  },
  backup: {
    export: () => Promise.resolve({ success: true }),
    import: () => Promise.resolve({ success: true }),
  },
  settings: (() => {
    let settingsStore: Record<string, unknown> = { outlet_name: 'Mock Restaurant' };
    return {
      get: () => Promise.resolve({ success: true, data: settingsStore }),
      save: (payload: Record<string, unknown>) => {
        settingsStore = { ...settingsStore, ...payload };
        return Promise.resolve({ success: true });
      },
    };
  })(),
};

export const api = (ipcApi ?? mockApi) as {
  orders: {
    create: (payload: { tableId: number; staffId?: number; covers?: number; note?: string }) => Promise<IPCResponse<number>>;
    addItem: (payload: unknown) => Promise<IPCResponse<unknown>>;
    updateItem: (payload: unknown) => Promise<IPCResponse<unknown>>;
    removeItem: (payload: unknown) => Promise<IPCResponse<unknown>>;
    getOpen: () => Promise<IPCResponse<unknown>>;
    getByTable: (payload: { tableId: number }) => Promise<IPCResponse<(Order & { items: OrderItem[] }) | null>>;
    sendKOT: (payload: { tableId: number; items: CartItem[]; staffId?: number; covers?: number; note?: string }) => Promise<IPCResponse<number>>;
    cancelByTable: (payload: { tableId: number; note?: string }) => Promise<IPCResponse<unknown>>;
  };
  kds: {
    getActiveTickets: () => Promise<IPCResponse<KDSTicket[]>>;
    updateItemStatus: (payload: { itemId: number; status: 'pending' | 'preparing' | 'ready' | 'served' }) => Promise<IPCResponse<unknown>>;
    updateOrderStatus: (payload: { orderId: number; status: 'pending' | 'preparing' | 'ready' | 'served' }) => Promise<IPCResponse<unknown>>;
  };
  menu: {
    getAll: () => Promise<IPCResponse<(Category & { items: MenuItem[] })[]>>;
    upsertItem: (payload: Partial<MenuItem>) => Promise<IPCResponse<MenuItem>>;
    deleteItem: (payload: { id: number }) => Promise<IPCResponse<unknown>>;
    toggleAvailable: (payload: { id: number; is_available: number }) => Promise<IPCResponse<unknown>>;
    upsertCategory: (payload: Partial<Category>) => Promise<IPCResponse<Category>>;
    deleteCategory: (payload: { id: number }) => Promise<IPCResponse<unknown>>;
    getRecipe: (payload: { menu_item_id: number }) => Promise<IPCResponse<RecipeItem[]>>;
    updateRecipe: (payload: { menu_item_id: number; ingredients: { inventory_item_id: number; qty_used: number }[] }) => Promise<IPCResponse<unknown>>;
  };
  tables: {
    getAll: () => Promise<IPCResponse<unknown>>;
    upsert: (payload: unknown) => Promise<IPCResponse<unknown>>;
    delete: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
  billing: {
    createBill: (payload: unknown) => Promise<IPCResponse<unknown>>;
    getBill: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
  print: {
    kot: (payload: unknown) => Promise<IPCResponse<unknown>>;
    bill: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
  inventory: {
    getAll: () => Promise<IPCResponse<InventoryItem[]>>;
    adjust: (payload: { item_id: number; type: 'purchase' | 'sale' | 'adjustment' | 'wastage'; qty_change: number; note?: string; }) => Promise<IPCResponse<unknown>>;
    upsertItem: (payload: Partial<InventoryItem>) => Promise<IPCResponse<{ id: number }>>;
  };
  staff: {
    login: (payload: { pin: string }) => Promise<IPCResponse<{ id: number; name: string; role: string }>>;
    getAll: () => Promise<IPCResponse<unknown>>;
    upsert: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
  shifts: {
    getActive: () => Promise<IPCResponse<Shift | null>>;
    open: (payload: { staffId: number; openingCash: number }) => Promise<IPCResponse<{ id: number }>>;
    close: (payload: { shiftId: number; closingCash: number; note?: string }) => Promise<IPCResponse<unknown>>;
    getTotals: (payload: { openedAt: string }) => Promise<IPCResponse<{ cash: number; card: number; upi: number; complimentary: number }>>;
  };
  reports: {
    daily: (payload: unknown) => Promise<IPCResponse<unknown>>;
    gst: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
  backup: {
    export: (payload: unknown) => Promise<IPCResponse<unknown>>;
    import: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
  settings: {
    get: () => Promise<IPCResponse<unknown>>;
    save: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
};
