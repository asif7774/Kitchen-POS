import { create } from 'zustand';
import { api } from '../lib/ipc';
import { MenuItem } from '../types/models';

interface Order {
  id: number;
  table_id: number;
  status: string;
}

interface OrderState {
  activeOrders: Order[];
  selectedTableId: number | null;
  fetchOpenOrders: () => Promise<void>;
  selectTable: (id: number) => void;
  addItem: (orderId: number, item: MenuItem) => Promise<void>;
  removeItem: (orderId: number, itemId: number) => Promise<void>;
  sendKOT: (orderId: number) => Promise<void>;
  generateBill: (orderId: number) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrders: [],
  selectedTableId: null,
  fetchOpenOrders: async () => {
    const res = await api.orders.getOpen();
    if (res.success) {
      set({ activeOrders: res.data as Order[] });
    }
  },
  selectTable: (id: number) => { set({ selectedTableId: id }); },
  addItem: async (_orderId: number, _item: MenuItem) => {
    // API Call to add item
  },
  removeItem: async (_orderId: number, _itemId: number) => {
    // API Call to remove item
  },
  sendKOT: async (_orderId: number) => {
    // Call KOT
  },
  generateBill: async (_orderId: number) => {
    // Call generate bill
  }
}));
