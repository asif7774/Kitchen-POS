import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  orders: {
    create: (payload: any) => ipcRenderer.invoke('orders:create', payload),
    addItem: (payload: any) => ipcRenderer.invoke('orders:addItem', payload),
    updateItem: (payload: any) => ipcRenderer.invoke('orders:updateItem', payload),
    removeItem: (payload: any) => ipcRenderer.invoke('orders:removeItem', payload),
    getOpen: () => ipcRenderer.invoke('orders:getOpen'),
    getByTable: (payload: any) => ipcRenderer.invoke('orders:getByTable', payload),
    sendKOT: (payload: any) => ipcRenderer.invoke('orders:sendKOT', payload),
    cancelByTable: (payload: any) => ipcRenderer.invoke('orders:cancelByTable', payload),
  },
  kds: {
    getActiveTickets: () => ipcRenderer.invoke('kds:getActiveTickets'),
    updateItemStatus: (payload: any) => ipcRenderer.invoke('kds:updateItemStatus', payload),
    updateOrderStatus: (payload: any) => ipcRenderer.invoke('kds:updateOrderStatus', payload),
  },
  menu: {
    getAll: () => ipcRenderer.invoke('menu:getAll'),
    upsertItem: (payload: any) => ipcRenderer.invoke('menu:upsertItem', payload),
    deleteItem: (payload: any) => ipcRenderer.invoke('menu:deleteItem', payload),
    toggleAvailable: (payload: any) => ipcRenderer.invoke('menu:toggleAvailable', payload),
    upsertCategory: (payload: any) => ipcRenderer.invoke('menu:upsertCategory', payload),
    deleteCategory: (payload: any) => ipcRenderer.invoke('menu:deleteCategory', payload),
  },
  tables: {
    getAll: () => ipcRenderer.invoke('tables:getAll'),
    upsert: (payload: any) => ipcRenderer.invoke('tables:upsert', payload),
    delete: (payload: any) => ipcRenderer.invoke('tables:delete', payload),
  },
  billing: {
    createBill: (payload: any) => ipcRenderer.invoke('billing:createBill', payload),
    getBill: (payload: any) => ipcRenderer.invoke('billing:getBill', payload),
  },
  print: {
    kot: (payload: any) => ipcRenderer.invoke('print:kot', payload),
    bill: (payload: any) => ipcRenderer.invoke('print:bill', payload),
  },
  inventory: {
    getAll: () => ipcRenderer.invoke('inventory:getAll'),
    adjust: (payload: any) => ipcRenderer.invoke('inventory:adjust', payload),
    upsertItem: (payload: any) => ipcRenderer.invoke('inventory:upsertItem', payload),
  },
  staff: {
    login: (payload: any) => ipcRenderer.invoke('staff:login', payload),
    getAll: () => ipcRenderer.invoke('staff:getAll'),
    upsert: (payload: any) => ipcRenderer.invoke('staff:upsert', payload),
  },
  shifts: {
    getActive: () => ipcRenderer.invoke('shifts:getActive'),
    open: (payload: any) => ipcRenderer.invoke('shifts:open', payload),
    close: (payload: any) => ipcRenderer.invoke('shifts:close', payload),
    getTotals: (payload: any) => ipcRenderer.invoke('shifts:getTotals', payload),
  },
  reports: {
    daily: (payload: any) => ipcRenderer.invoke('reports:daily', payload),
    gst: (payload: any) => ipcRenderer.invoke('reports:gst', payload),
  },
  backup: {
    export: (payload: any) => ipcRenderer.invoke('backup:export', payload),
    import: (payload: any) => ipcRenderer.invoke('backup:import', payload),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (payload: any) => ipcRenderer.invoke('settings:save', payload),
  }
});
