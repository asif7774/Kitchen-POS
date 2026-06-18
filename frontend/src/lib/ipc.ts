import { Category, MenuItem, InventoryItem, Order, OrderItem, CartItem, KDSTicket, Shift, RecipeItem, Table, Expense, Staff } from '../types/models';

export interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const ipcApi = (window as unknown as { api: unknown }).api;

const mockApi = {
  orders: {
    create: () => Promise.resolve({ success: true, data: 1 }),
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
    getMenus: () => Promise.resolve({ success: true, data: [{ id: 1, name: 'Main Menu', is_active: 1, is_default: 1 }] }),
    upsertMenu: () => Promise.resolve({ success: true, data: { id: 999 } }),
    duplicateMenu: () => Promise.resolve({ success: true, data: { id: 999 } }),
    uploadImage: () => Promise.resolve({ success: true, data: 'file:///tmp/img.png' }),
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
    upsert: () => Promise.resolve({ success: true, data: { id: 2 } }),
    delete: () => Promise.resolve({ success: true }),
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
    daily: () => Promise.resolve({ 
      success: true, 
      data: {
        date: new Date().toISOString().split('T')[0],
        totalOrders: 0,
        totalRevenue: 0,
        totalCGST: 0,
        totalSGST: 0,
        hourlyData: []
      } 
    }),
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
  expenses: {
    getAll: () => Promise.resolve({ success: true, data: [] }),
    create: () => Promise.resolve({ success: true, data: { id: 1 } }),
    delete: () => Promise.resolve({ success: true }),
  },
  customers: {
    getAll: () => Promise.resolve({ success: true, data: [] }),
    getById: () => Promise.resolve({ success: true, data: null }),
    create: () => Promise.resolve({ success: true, data: { id: 1 } }),
    update: () => Promise.resolve({ success: true }),
    delete: () => Promise.resolve({ success: true }),
    search: () => Promise.resolve({ success: true, data: [] }),
    settleBalance: () => Promise.resolve({ success: true }),
    getHistory: () => Promise.resolve({ success: true, data: [] }),
  },
  dashboard: {
    getMetrics: () => Promise.resolve({ success: true, data: { metrics: { totalSales: 0, totalOrders: 0, averageOrderValue: 0, totalCustomers: 0, outstandingBalances: 0 }, trendData: [], topItemsData: [] } }),
  },
  onMenuScheduleTriggered: (_callback: (data: { menuId: number; menuName: string; action: 'enabled' | 'disabled' }) => void) => {
    // mock implementation does nothing
  }
};

export const api = (ipcApi ?? mockApi) as {
  orders: {
    create: (payload: { tableId: number; staffId?: number; covers?: number; note?: string; customerId?: number }) => Promise<IPCResponse<number>>;
    getOpen: () => Promise<IPCResponse<unknown>>;
    getByTable: (payload: { tableId: number }) => Promise<IPCResponse<(Order & { items: OrderItem[] }) | null>>;
    sendKOT: (payload: { tableId: number; items: CartItem[]; staffId?: number; covers?: number; note?: string; customerId?: number }) => Promise<IPCResponse<{ orderId: number; itemsToPrint: CartItem[] }>>;
    cancelByTable: (payload: { tableId: number; note?: string }) => Promise<IPCResponse<unknown>>;
    updateCustomer: (payload: { orderId: number; customerId: number }) => Promise<IPCResponse<unknown>>;
  };
  kds: {
    getActiveTickets: () => Promise<IPCResponse<KDSTicket[]>>;
    updateItemStatus: (payload: { itemId: number; status: 'pending' | 'preparing' | 'ready' | 'served' }) => Promise<IPCResponse<unknown>>;
    updateOrderStatus: (payload: { orderId: number; status: 'pending' | 'preparing' | 'ready' | 'served' }) => Promise<IPCResponse<unknown>>;
  };
  menu: {
    getMenus: () => Promise<IPCResponse<import('../types/models').Menu[]>>;
    upsertMenu: (payload: { id?: number; name: string; is_default?: number; is_active?: number; auto_enable_time?: string | null; auto_disable_time?: string | null; schedule_enabled?: number; }) => Promise<IPCResponse<{ id: number }>>;
    duplicateMenu: (payload: { id: number; newName: string }) => Promise<IPCResponse<{ id: number }>>;
    uploadImage: () => Promise<IPCResponse<string>>;
    getAll: (menuId?: number) => Promise<IPCResponse<(Category & { items: MenuItem[] })[]>>;
    upsertItem: (payload: Partial<MenuItem>) => Promise<IPCResponse<MenuItem>>;
    deleteItem: (payload: { id: number }) => Promise<IPCResponse<unknown>>;
    toggleAvailable: (payload: { id: number; is_available: number }) => Promise<IPCResponse<unknown>>;
    upsertCategory: (payload: Partial<Category>) => Promise<IPCResponse<Category>>;
    deleteCategory: (payload: { id: number }) => Promise<IPCResponse<unknown>>;
    getRecipe: (payload: { menu_item_id: number }) => Promise<IPCResponse<RecipeItem[]>>;
    updateRecipe: (payload: { menu_item_id: number; ingredients: { inventory_item_id: number; qty_used: number }[] }) => Promise<IPCResponse<unknown>>;
  };
  tables: {
    getAll: () => Promise<IPCResponse<Table[]>>;
    upsert: (payload: Partial<Table>) => Promise<IPCResponse<Table>>;
    delete: (payload: { id: number }) => Promise<IPCResponse<unknown>>;
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
    getAll: () => Promise<IPCResponse<Staff[]>>;
    upsert: (payload: Partial<Staff>) => Promise<IPCResponse<{ id: number }>>;
    delete: (payload: { id: number }) => Promise<IPCResponse<unknown>>;
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
    getPastOrders: (payload: { filter: 'daily' | 'weekly' | 'monthly' | 'yearly' }) => Promise<IPCResponse<{ stats: import('../types/models').PastOrderStats; orders: import('../types/models').PastOrderData[] }>>;
  };
  backup: {
    export: (payload: unknown) => Promise<IPCResponse<unknown>>;
    import: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
  settings: {
    get: () => Promise<IPCResponse<unknown>>;
    save: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
  expenses: {
    getAll: (payload?: { start?: string, end?: string }) => Promise<IPCResponse<Expense[]>>;
    create: (payload: { date: string, category: string, amount: number, description?: string, staff_id?: number }) => Promise<IPCResponse<{id: number}>>;
    delete: (payload: { id: number }) => Promise<IPCResponse<unknown>>;
  };
  customers: {
    getAll: () => Promise<IPCResponse<import('../types/models').Customer[]>>;
    getById: (id: number) => Promise<IPCResponse<import('../types/models').Customer>>;
    create: (payload: Partial<import('../types/models').Customer>) => Promise<IPCResponse<{id: number}>>;
    update: (payload: Partial<import('../types/models').Customer> & {id: number}) => Promise<IPCResponse<unknown>>;
    delete: (payload: number) => Promise<IPCResponse<unknown>>;
    search: (payload: string) => Promise<IPCResponse<import('../types/models').Customer[]>>;
    settleBalance: (payload: { customerId: number; amount: number; method: string }) => Promise<IPCResponse<unknown>>;
    getHistory: (payload: number) => Promise<IPCResponse<import('../types/models').CustomerHistory[]>>;
  };
  dashboard: {
    getMetrics: (payload: { filter: string }) => Promise<IPCResponse<{
      metrics: {
        totalSales: number;
        totalOrders: number;
        averageOrderValue: number;
        totalCustomers: number;
        outstandingBalances: number;
      };
      trendData: { label: string; sales: number }[];
      topItemsData: { name: string; quantity: number }[];
    }>>;
  };
  onMenuScheduleTriggered: (callback: (data: { menuId: number; menuName: string; action: 'enabled' | 'disabled' }) => void) => void;
};
