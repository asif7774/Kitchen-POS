import { Category, MenuItem, InventoryItem } from '../types/models';

export interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const ipcApi = (window as unknown as { api: unknown }).api;

const mockApi = {
  orders: {
    create: () => Promise.resolve({ success: true, data: { id: 1 } }),
    addItem: () => Promise.resolve({ success: true }),
    updateItem: () => Promise.resolve({ success: true }),
    removeItem: () => Promise.resolve({ success: true }),
    getOpen: () => Promise.resolve({ success: true, data: [] }),
    getByTable: () => Promise.resolve({ success: true, data: [] }),
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
  reports: {
    daily: () => Promise.resolve({ success: true, data: {} }),
    gst: () => Promise.resolve({ success: true, data: {} }),
  },
  backup: {
    export: () => Promise.resolve({ success: true }),
    import: () => Promise.resolve({ success: true }),
  },
  settings: {
    get: () => Promise.resolve({ success: true, data: { outlet_name: 'Mock Restaurant' } }),
    save: () => Promise.resolve({ success: true }),
  },
};

export const api = (ipcApi ?? mockApi) as {
  orders: {
    create: (payload: unknown) => Promise<IPCResponse<unknown>>;
    addItem: (payload: unknown) => Promise<IPCResponse<unknown>>;
    updateItem: (payload: unknown) => Promise<IPCResponse<unknown>>;
    removeItem: (payload: unknown) => Promise<IPCResponse<unknown>>;
    getOpen: () => Promise<IPCResponse<unknown>>;
    getByTable: (payload: unknown) => Promise<IPCResponse<unknown>>;
  };
  menu: {
    getAll: () => Promise<IPCResponse<(Category & { items: MenuItem[] })[]>>;
    upsertItem: (payload: Partial<MenuItem>) => Promise<IPCResponse<MenuItem>>;
    deleteItem: (payload: { id: number }) => Promise<IPCResponse<unknown>>;
    toggleAvailable: (payload: { id: number; is_available: number }) => Promise<IPCResponse<unknown>>;
    upsertCategory: (payload: Partial<Category>) => Promise<IPCResponse<Category>>;
    deleteCategory: (payload: { id: number }) => Promise<IPCResponse<unknown>>;
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
    login: (payload: unknown) => Promise<IPCResponse<unknown>>;
    getAll: () => Promise<IPCResponse<unknown>>;
    upsert: (payload: unknown) => Promise<IPCResponse<unknown>>;
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
