# Kitchen POS — IPC API Reference

All communication between the React renderer and the Electron main process goes through named IPC channels. This document lists every registered channel with its payload shape, return shape, and any constraints.

---

## Standard Response Envelope

Every handler returns one of these two shapes:

```ts
type IPCResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

Callers must check `success` before using `data`. Never assume success.

---

## Orders

### `orders:create`
Create a new order for a table.

**Payload:**
```ts
{
  tableId: number
  staffId?: number
  covers?: number        // default 1
  note?: string
  customerId?: number
  type?: 'dine-in' | 'takeaway' | 'delivery'  // default 'dine-in'
}
```
**Returns:** `{ success: true, data: number }` — the new order ID.

---

### `orders:sendKOT`
Create or update an order for a table and print a KOT slip. This is the primary order-taking channel. If an open order exists for `tableId`, items are added to it; otherwise a new order is created.

**Payload:**
```ts
{
  tableId: number
  items: Array<{
    id: number        // menu_item_id
    name: string
    price: number
    qty: number
    note: string
  }>
  staffId?: number
  covers?: number
  note?: string
  customerId?: number
  type?: 'dine-in' | 'takeaway' | 'delivery'
}
```
**Returns:** `{ success: true, data: orderId }` on success. Printer errors are surfaced as `{ success: false, error: string }`.

**Side effects:** Items inserted into `order_items` with snapshotted price and tax; `kot_printed = 1` set on all printed items; `orders.status` → `'kot_sent'`.

---

### `orders:getOpen`
Fetch all orders that are not billed or cancelled.

**Payload:** none

**Returns:** `{ success: true, data: Order[] }` — includes `customer_name` joined from customers.

---

### `orders:getByTable`
Fetch the open order for a specific table.

**Payload:**
```ts
{ tableId: number }
```
**Returns:** `{ success: true, data: Order | null }`

---

### `orders:addItem`
Add a single item to an existing open order.

**Payload:**
```ts
{
  orderId: number
  menuItemId: number
  qty: number
  note?: string
}
```
**Returns:** `{ success: true, data: order_item_id }`

---

### `orders:updateItem`
Update quantity or note on an existing order item.

**Payload:**
```ts
{
  itemId: number
  qty: number
  note?: string
}
```
**Returns:** `{ success: true }`

---

### `orders:removeItem`
Delete an item from an open order.

**Payload:**
```ts
{ itemId: number }
```
**Returns:** `{ success: true }`

---

### `orders:updateCustomer`
Link or change the customer on an existing order.

**Payload:**
```ts
{ orderId: number; customerId: number }
```
**Returns:** `{ success: true }`

---

### `orders:cancelOrder`
Cancel an open order.

**Payload:**
```ts
{ orderId: number }
```
**Returns:** `{ success: true }`

---

## Billing

### `billing:createBill`
Convert a completed order into a GST bill and record payment.

**Payload:**
```ts
{
  orderId: number
  payments: Array<{
    method: 'cash' | 'card' | 'upi' | 'complimentary' | 'unpaid'
    amount: number
    reference?: string   // UPI txn ID or card last 4 digits
  }>
  discount?: number      // default 0
  customerId?: number
}
```
**Returns:** `{ success: true, data: Bill }` — includes `bill_number`, totals, and timestamps.

**Side effects:** INSERT into `bills` and `payments`; UPDATE `orders.status` → `'billed'`; inventory auto-deducted; customer stats updated if linked.

---

### `billing:getBill`
Currently a stub. Returns `{ success: true }`.

---

## Menu

### `menu:getMenus`
Fetch all menus.

**Payload:** none

**Returns:** `{ success: true, data: Menu[] }`

---

### `menu:upsertMenu`
Create or update a menu record.

**Payload:**
```ts
{
  id?: number
  name: string
  is_default?: number
  is_active?: number
  auto_enable_time?: string | null   // 'HH:MM' format
  auto_disable_time?: string | null
  schedule_enabled?: number
}
```
**Returns:** `{ success: true, data: menu_id }`

---

### `menu:duplicateMenu`
Clone a menu with all its categories and items.

**Payload:**
```ts
{ menuId: number; newName: string }
```
**Returns:** `{ success: true, data: new_menu_id }`

---

### `menu:getAll`
Fetch all categories with their items for a given menu.

**Payload:**
```ts
{ menuId?: number }   // defaults to the default menu
```
**Returns:** `{ success: true, data: CategoryWithItems[] }`

---

### `menu:upsertCategory`
Create or update a category.

**Payload:**
```ts
{
  id?: number
  menu_id: number
  name: string
  sort_order?: number
}
```
**Returns:** `{ success: true, data: category_id }`

---

### `menu:deleteCategory`
Delete a category and its items.

**Payload:**
```ts
{ id: number }
```
**Returns:** `{ success: true }`

---

### `menu:upsertItem`
Create or update a menu item.

**Payload:**
```ts
{
  id?: number
  category_id: number
  name: string
  price: number
  cgst_rate: number
  sgst_rate: number
  hsn_code?: string
  is_veg?: number        // 1 = veg, 0 = non-veg
  is_available?: number  // 1 = available, 0 = hidden
  sort_order?: number
  image_url?: string
}
```
**Returns:** `{ success: true, data: item_id }`

---

### `menu:deleteItem`
Delete a menu item.

**Payload:**
```ts
{ id: number }
```
**Returns:** `{ success: true }`

---

### `menu:toggleAvailable`
Toggle the `is_available` flag on a menu item.

**Payload:**
```ts
{ id: number; is_available: number }
```
**Returns:** `{ success: true }`

---

### `menu:uploadImage`
Save an uploaded image file and return its stored path.

**Payload:** File buffer + metadata (handled via dialog in main process)

**Returns:** `{ success: true, data: string }` — path to saved image file.

---

### `menu:getRecipe`
Fetch inventory mappings (recipe) for a menu item.

**Payload:**
```ts
{ menuItemId: number }
```
**Returns:** `{ success: true, data: RecipeItem[] }`

---

### `menu:updateRecipe`
Update the inventory ingredient mapping for a menu item.

**Payload:**
```ts
{
  menuItemId: number
  ingredients: Array<{ inventoryItemId: number; qtyUsed: number }>
}
```
**Returns:** `{ success: true }`

---

## Tables

### `tables:getAll`
Fetch all tables with computed occupancy status.

**Payload:** none

**Returns:** `{ success: true, data: Table[] }` — each table includes a derived `status` field.

---

### `tables:upsert`
Create or update a table.

**Payload:**
```ts
{
  id?: number
  name: string
  capacity?: number
  section?: string
}
```
**Returns:** `{ success: true, data: table_id }`

---

### `tables:delete`
Delete a table.

**Payload:**
```ts
{ id: number }
```
**Returns:** `{ success: true }`

---

## Inventory

### `inventory:getAll`
Fetch all inventory items.

**Payload:** none

**Returns:** `{ success: true, data: InventoryItem[] }`

---

### `inventory:upsertItem`
Create or update an inventory item.

**Payload:**
```ts
{
  id?: number
  name: string
  unit: string
  qty_in_stock?: number
  low_stock_alert_at?: number
  cost_per_unit?: number
}
```
**Returns:** `{ success: true, data: item_id }`

---

### `inventory:adjust`
Log a manual stock adjustment.

**Payload:**
```ts
{
  item_id: number
  qty_change: number          // positive or negative
  type: 'purchase' | 'adjustment' | 'wastage'
  note?: string
}
```
**Returns:** `{ success: true }`

---

## Staff

### `staff:login`
Verify a PIN and return the matching staff record.

**Payload:**
```ts
{ pin: string }
```
**Returns:** `{ success: true, data: Staff }` on match, or `{ success: false, error: string }` on no match or lockout.

---

### `staff:getAll`
Fetch all staff records (active and inactive).

**Payload:** none

**Returns:** `{ success: true, data: Staff[] }`

---

### `staff:upsert`
Create or update a staff member.

**Payload:**
```ts
{
  id?: number
  name: string
  pin: string        // plaintext — hashed in handler
  role: 'admin' | 'manager' | 'cashier' | 'waiter'
  is_active?: number
}
```
**Returns:** `{ success: true, data: staff_id }`

---

### `staff:delete`
Delete a staff member.

**Payload:**
```ts
{ id: number }
```
**Returns:** `{ success: true }`

---

## Shifts

### `shifts:open`
Open a new shift for a staff member.

**Payload:**
```ts
{ staffId: number; openingCash: number }
```
**Returns:** `{ success: true, data: shift_id }`

---

### `shifts:close`
Close the active shift for a staff member.

**Payload:**
```ts
{ shiftId: number; closingCash: number; note?: string }
```
**Returns:** `{ success: true }`

---

### `shifts:getActive`
Fetch the currently open shift for a staff member.

**Payload:**
```ts
{ staffId: number }
```
**Returns:** `{ success: true, data: Shift | null }`

---

### `shifts:getTotals`
Get sales totals for a completed shift.

**Payload:**
```ts
{ shiftId: number }
```
**Returns:** `{ success: true, data: ShiftTotals }`

---

## Reports

### `reports:daily`
Get the daily sales summary for a given date.

**Payload:**
```ts
{ date: string }   // YYYY-MM-DD
```
**Returns:** `{ success: true, data: DailySummary }`

---

### `reports:gst`
Get the GST report for a date range.

**Payload:**
```ts
{ from: string; to: string }   // YYYY-MM-DD
```
**Returns:** `{ success: true, data: GSTReport }`

---

### `reports:getPastOrders`
Get paginated past orders with filters.

**Payload:**
```ts
{
  from?: string
  to?: string
  page?: number
  limit?: number
}
```
**Returns:** `{ success: true, data: { orders: Order[]; total: number } }`

---

### `reports:printPastBill`
Reprint a bill from history.

**Payload:**
```ts
{ billId: number }
```
**Returns:** `{ success: true }` or `{ success: false, error: string }` on printer error.

---

## Dashboard

### `dashboard:getMetrics`
Get today's at-a-glance metrics.

**Payload:** none

**Returns:**
```ts
{
  success: true,
  data: {
    todaySales: number
    todayOrders: number
    openTables: number
    lowStockCount: number
  }
}
```

---

## Customers

### `customers:getAll`
Fetch all customers.

**Payload:** none

**Returns:** `{ success: true, data: Customer[] }`

---

### `customers:search`
Search customers by name or phone.

**Payload:**
```ts
{ query: string }
```
**Returns:** `{ success: true, data: Customer[] }`

---

### `customers:getById`
Fetch a single customer.

**Payload:**
```ts
{ id: number }
```
**Returns:** `{ success: true, data: Customer }`

---

### `customers:create`
Create a new customer.

**Payload:**
```ts
{
  name: string
  phone?: string
  email?: string
  credit_limit?: number
}
```
**Returns:** `{ success: true, data: customer_id }`

---

### `customers:update`
Update a customer record.

**Payload:**
```ts
{
  id: number
  name?: string
  phone?: string
  email?: string
  credit_limit?: number
}
```
**Returns:** `{ success: true }`

---

### `customers:delete`
Delete a customer.

**Payload:**
```ts
{ id: number }
```
**Returns:** `{ success: true }`

---

### `customers:getHistory`
Fetch order history for a customer.

**Payload:**
```ts
{ customerId: number }
```
**Returns:** `{ success: true, data: Order[] }`

---

### `customers:settleBalance`
Record a payment against a customer's outstanding balance.

**Payload:**
```ts
{
  customerId: number
  amount: number
  method: 'cash' | 'card' | 'upi'
  reference?: string
}
```
**Returns:** `{ success: true }`

---

## Expenses

### `expenses:getAll`
Fetch expenses with optional date filter.

**Payload:**
```ts
{ date?: string }   // YYYY-MM-DD; omit for all
```
**Returns:** `{ success: true, data: Expense[] }`

---

### `expenses:create`
Log a new expense.

**Payload:**
```ts
{
  date: string
  category: string
  amount: number
  description?: string
  staff_id?: number
}
```
**Returns:** `{ success: true, data: expense_id }`

---

### `expenses:delete`
Delete an expense entry.

**Payload:**
```ts
{ id: number }
```
**Returns:** `{ success: true }`

---

## KDS (Kitchen Display Screen)

### `kds:getActiveTickets`
Fetch all order items that are pending or in preparation.

**Payload:** none

**Returns:** `{ success: true, data: KDSTicket[] }` — grouped by order.

---

### `kds:updateItemStatus`
Update the preparation status of an order item.

**Payload:**
```ts
{
  itemId: number
  status: 'pending' | 'preparing' | 'ready' | 'served'
}
```
**Returns:** `{ success: true }`. Side effect: writes `prepared_at` or `served_at` timestamp.

---

### `kds:updateOrderStatus`
Bulk-update preparation status for all items in an order.

**Payload:**
```ts
{
  orderId: number
  status: 'pending' | 'preparing' | 'ready' | 'served'
}
```
**Returns:** `{ success: true }`

---

## Printer

### `print:kot`
Print a KOT slip for an existing order. (Lower-level than `orders:sendKOT`.)

**Payload:**
```ts
{ orderId: number }
```
**Returns:** `{ success: true }` or `{ success: false, error: string }` on printer failure.

---

### `print:bill`
Print a GST bill receipt.

**Payload:**
```ts
{ billId: number }
```
**Returns:** `{ success: true }` or `{ success: false, error: string }` on printer failure.

---

## Backup

### `backup:export`
Export the database to a file. Opens a save dialog if no path is provided.

**Payload:**
```ts
{ path?: string }
```
**Returns:** `{ success: true }` or `{ success: false, error: string }`

---

### `backup:import`
Import a database from a file. Opens an open dialog if no path is provided.

**Payload:**
```ts
{ path?: string }
```
**Returns:** `{ success: true }` or `{ success: false, error: string }`

---

### `backup:getAutoBackupConfig`
Fetch the current auto-backup configuration from electron-store.

**Payload:** none

**Returns:** `{ success: true, data: AutoBackupConfig }`

---

### `backup:setAutoBackupConfig`
Update the auto-backup configuration.

**Payload:**
```ts
{
  enabled: boolean
  path?: string
  frequency?: 'daily' | 'weekly' | 'monthly'
}
```
**Returns:** `{ success: true }`

---

### `backup:selectAutoBackupPath`
Open a folder chooser dialog and return the selected path.

**Payload:** none

**Returns:** `{ success: true, data: string | null }`

---

### `backup:triggerNow`
Trigger an immediate backup to the configured auto-backup path.

**Payload:** none

**Returns:** `{ success: true }` or `{ success: false, error: string }`

---

## Settings

### `settings:get`
Fetch all settings from electron-store.

**Payload:** none

**Returns:**
```ts
{
  success: true,
  data: {
    outletName: string
    outletAddress: string
    gstin: string
    // printer and other config fields
  }
}
```

---

### `settings:save`
Save settings to electron-store.

**Payload:**
```ts
{
  outletName?: string
  outletAddress?: string
  gstin?: string
  // any additional settings fields
}
```
**Returns:** `{ success: true }`

---

## Business Sessions

### `businessSession:start`
Open a new business session for a date.

**Payload:**
```ts
{
  business_date: string   // YYYY-MM-DD
  started_by: number      // staff_id
  notes?: string
}
```
**Returns:** `{ success: true, data: session_id }` or `{ success: false, error }` if a session is already open.

---

### `businessSession:close`
Close the active business session.

**Payload:**
```ts
{
  closed_by: number
  notes?: string
}
```
**Returns:** `{ success: true }`

---

### `businessSession:getActive`
Fetch the currently open business session.

**Payload:** none

**Returns:** `{ success: true, data: BusinessSession | null }`

---

## System

### `system:isSetupComplete`
Check whether initial setup has been completed.

**Payload:** none

**Returns:** `{ success: true, data: boolean }`

---

### `system:completeSetup`
Mark initial setup as complete.

**Payload:** none

**Returns:** `{ success: true }`

---

### `system:factoryReset`
Delete all data and reset the application to initial state.

**Payload:** none

**Returns:** `{ success: true }` — irreversible.
