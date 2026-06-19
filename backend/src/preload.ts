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
    cancelOrder: (payload: any) => ipcRenderer.invoke('orders:cancelOrder', payload),
    updateCustomer: (payload: any) => ipcRenderer.invoke('orders:updateCustomer', payload),
  },
  kds: {
    getActiveTickets: () => ipcRenderer.invoke('kds:getActiveTickets'),
    updateItemStatus: (payload: any) => ipcRenderer.invoke('kds:updateItemStatus', payload),
    updateOrderStatus: (payload: any) => ipcRenderer.invoke('kds:updateOrderStatus', payload),
  },
  menu: {
    getMenus: () => ipcRenderer.invoke('menu:getMenus'),
    upsertMenu: (payload: any) => ipcRenderer.invoke('menu:upsertMenu', payload),
    duplicateMenu: (payload: any) => ipcRenderer.invoke('menu:duplicateMenu', payload),
    uploadImage: () => ipcRenderer.invoke('menu:uploadImage'),
    getAll: (menuId?: number) => ipcRenderer.invoke('menu:getAll', menuId),
    upsertItem: (payload: any) => ipcRenderer.invoke('menu:upsertItem', payload),
    deleteItem: (payload: any) => ipcRenderer.invoke('menu:deleteItem', payload),
    toggleAvailable: (payload: any) => ipcRenderer.invoke('menu:toggleAvailable', payload),
    upsertCategory: (payload: any) => ipcRenderer.invoke('menu:upsertCategory', payload),
    deleteCategory: (payload: any) => ipcRenderer.invoke('menu:deleteCategory', payload),
    getRecipe: (payload: any) => ipcRenderer.invoke('menu:getRecipe', payload),
    updateRecipe: (payload: any) => ipcRenderer.invoke('menu:updateRecipe', payload),
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
    delete: (payload: any) => ipcRenderer.invoke('staff:delete', payload),
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
    getPastOrders: (payload: any) => ipcRenderer.invoke('reports:getPastOrders', payload),
    printPastBill: (payload: any) => ipcRenderer.invoke('reports:printPastBill', payload),
  },
  backup: {
    export: (payload: any) => ipcRenderer.invoke('backup:export', payload),
    import: (payload: any) => ipcRenderer.invoke('backup:import', payload),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (payload: any) => ipcRenderer.invoke('settings:save', payload),
  },
  expenses: {
    getAll: (payload?: any) => ipcRenderer.invoke('expenses:getAll', payload),
    create: (payload: any) => ipcRenderer.invoke('expenses:create', payload),
    delete: (payload: any) => ipcRenderer.invoke('expenses:delete', payload),
  },
  customers: {
    getAll: () => ipcRenderer.invoke('customers:getAll'),
    getById: (id: number) => ipcRenderer.invoke('customers:getById', id),
    create: (payload: any) => ipcRenderer.invoke('customers:create', payload),
    update: (payload: any) => ipcRenderer.invoke('customers:update', payload),
    delete: (payload: any) => ipcRenderer.invoke('customers:delete', payload),
    search: (payload: any) => ipcRenderer.invoke('customers:search', payload),
    settleBalance: (payload: any) => ipcRenderer.invoke('customers:settleBalance', payload),
    getHistory: (payload: any) => ipcRenderer.invoke('customers:getHistory', payload),
  },
  dashboard: {
    getMetrics: (payload: any) => ipcRenderer.invoke('dashboard:getMetrics', payload),
  },
  businessSession: {
    getActive: () => ipcRenderer.invoke('businessSession:getActive'),
    start: (payload: { staffId: number; notes?: string }) => ipcRenderer.invoke('businessSession:start', payload),
    close: (payload: { sessionId: number; staffId: number; notes?: string }) => ipcRenderer.invoke('businessSession:close', payload),
  },
  onBackupReminder: (callback: () => void) => {
    ipcRenderer.on('backup:reminderDue', () => { callback(); });
  },
  onMenuScheduleTriggered: (callback: (data: any) => void) => {
    ipcRenderer.on('menu:scheduleTriggered', (_event, value) => { callback(value); });
  }
});
