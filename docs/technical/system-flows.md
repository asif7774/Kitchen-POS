# Kitchen POS — System Flows

Key execution paths through the system with ASCII flow diagrams. All flows reflect the actual IPC handler implementation.

---

## 1. Application Startup

```
Electron main process (backend/src/main.ts)
    │
    ├─► Run DB migrations (db/migrate.ts)
    │       └─► Read migrations/ directory
    │               └─► Execute each *.sql file in numeric order
    │                   (idempotent — IF NOT EXISTS guards)
    │
    ├─► Register all IPC handlers
    │       ├─► registerOrdersIPC()
    │       ├─► registerMenuIPC()
    │       ├─► registerTablesIPC()
    │       ├─► registerBillingIPC()
    │       ├─► registerInventoryIPC()
    │       ├─► registerStaffIPC()
    │       ├─► registerReportsIPC()
    │       ├─► registerPrinterIPC()
    │       ├─► registerBackupIPC()
    │       ├─► registerSettingsIPC()
    │       ├─► registerDashboardIPC()
    │       ├─► registerCustomersIPC()
    │       ├─► registerExpensesIPC()
    │       ├─► registerKDSIPC()
    │       └─► registerBusinessSessionIPC()
    │
    ├─► Create BrowserWindow
    │       └─► Load React app
    │               ├─► Dev:  http://localhost:5200
    │               └─► Prod: file://frontend/dist/index.html
    │
    └─► React app boots → Router → Login page (PIN numpad)
```

---

## 2. Staff Login

```
User enters 4-digit PIN on login screen
    │
    └─► window.api.invoke('staff:login', { pin })
            │
            └─► preload.ts → ipcMain (staff.ts)
                    │
                    ├─► SELECT all active staff from DB
                    ├─► Compare PIN against each bcrypt hash
                    ├─► Check lockout (electron-store: failed_attempts_<id>)
                    │
                    ├─► Match found, not locked out
                    │       ├─► Reset failed attempts counter
                    │       └─► Return { success: true, data: staff }
                    │               └─► Zustand auth slice stores staff object
                    │                   Router redirects to Dashboard
                    │
                    └─► No match or locked out
                            ├─► Increment failed attempts counter
                            ├─► If attempts >= 3: set lockout timestamp
                            └─► Return { success: false, error: 'Invalid PIN' }
```

---

## 3. Order Lifecycle (Full Flow)

```
─────────────── TAKE ORDER ───────────────

Waiter taps available table on floor plan
    │
    └─► Order screen opens (no order exists yet)
            │
            └─► Waiter browses menu, adds items, sets qty and notes
                    │
                    └─► "Send to Kitchen" tapped
                            │
                            └─► window.api.invoke('orders:sendKOT', {
                                    tableId, items[], staffId, covers, note,
                                    customerId?, type
                                })
                                    │
                                    ├─► Check for existing open order for tableId
                                    │       ├─► Found: add new items to existing order
                                    │       └─► Not found: INSERT new order row
                                    │
                                    ├─► INSERT order_items (each with snapshotted
                                    │   name, unit_price, cgst_rate, sgst_rate,
                                    │   hsn_code, kot_printed=0)
                                    │
                                    ├─► Print KOT slip via printer service
                                    │       └─► On success: UPDATE order_items
                                    │               SET kot_printed=1
                                    │               UPDATE orders SET status='kot_sent'
                                    │
                                    └─► Return { success: true, data: orderId }

─────────────── ADD ITEMS LATER ───────────────

Waiter adds more items to the same order mid-meal
    │
    └─► "Send to Kitchen" again
            │
            └─► Same sendKOT flow; existing order found
                    │
                    └─► New items inserted (kot_printed=0)
                            Previous items (kot_printed=1) skipped on KOT slip
                            Only new items printed

─────────────── BILLING ───────────────

Cashier taps occupied table → "Generate Bill"
    │
    └─► Billing modal opens showing order items and totals
            │
            └─► Cashier selects payment method(s), enters amounts
                    │
                    └─► window.api.invoke('billing:createBill', {
                                orderId, payments[], discount?, customerId?
                            })
                                │
                                ├─► Recalculate totals from order_items snapshots
                                │   (taxable_amount, cgst_amount, sgst_amount, total)
                                │
                                ├─► Generate bill number
                                │   (electron-store: last_bill_number + 1)
                                │   Format: INV-{YYYY}-{XXXX}
                                │
                                ├─► INSERT bills row
                                ├─► INSERT payments rows (one per method)
                                ├─► UPDATE orders SET status='billed'
                                │
                                ├─► Deduct inventory
                                │   (menu_inventory_map lookup × qty per order_item)
                                │
                                └─► If customer linked:
                                        UPDATE customers.total_visits += 1
                                        UPDATE customers.outstanding_balance (if unpaid)

                                    └─► Return { success: true, data: bill }

─────────────── RECEIPT PRINT ───────────────

Bill created → print:bill triggered
    │
    └─► Build GST receipt:
            outlet name, address, GSTIN
            bill number, date, time
            each item: name, HSN, qty, rate, amount
            taxable amount
            CGST % and CGST amount
            SGST % and SGST amount
            grand total, payment method
            │
            └─► Print via USB thermal printer (escpos-usb)
                    └─► Table status → available (no open order)
```

---

## 4. IPC Security Boundary

Every call from the React renderer to the backend follows this exact path. There is no other way for the renderer to access Node.js, the file system, or the database.

```
┌─────────────────────────────────────────────┐
│  React Renderer (frontend)                  │
│                                             │
│  window.api.invoke('channel', payload)      │
│            ↑ typed wrapper in ipc-client.ts │
└─────────────────┬───────────────────────────┘
                  │  contextBridge whitelist
                  │  (preload.ts — only listed channels exposed)
                  │  contextIsolation: true
                  │  nodeIntegration: false
┌─────────────────▼───────────────────────────┐
│  Preload Script (backend/src/preload.ts)    │
│                                             │
│  ipcRenderer.invoke('channel', payload)     │
└─────────────────┬───────────────────────────┘
                  │  Electron IPC bridge
┌─────────────────▼───────────────────────────┐
│  Main Process (backend/src/main.ts)         │
│                                             │
│  ipcMain.handle('channel', handler)         │
│            │                                │
│            ├─► better-sqlite3 (SQLite DB)   │
│            ├─► escpos-usb (printer)         │
│            ├─► electron-store (settings)    │
│            └─► fs (backup file ops)         │
│                                             │
│  Returns: { success: boolean,               │
│             data?: T,                       │
│             error?: string }                │
└─────────────────────────────────────────────┘
```

---

## 5. KOT Print Flow (Detail)

```
print:sendKOT invoked
    │
    ├─► Find open order for table (or create one)
    ├─► Upsert order items (kot_printed = 0 for new items)
    │
    ├─► Select items WHERE kot_printed = 0
    │       │
    │       └─► No items to print?
    │               └─► Return success (nothing to do)
    │
    ├─► Open USB device connection
    │       │
    │       └─► Device not found?
    │               └─► Throw → caught → return { success: false, error }
    │                       UI shows retry dialog
    │
    ├─► Build KOT slip:
    │       "KITCHEN ORDER" (bold, centred)
    │       Table: [name]
    │       Time: [HH:MM:SS]
    │       ─────────────────────
    │       [qty]x  [item name]
    │           ** [item note]  (if present)
    │       ─────────────────────
    │       NOTE: [order note]  (if present)
    │
    ├─► printer.cut().close()
    │
    ├─► On success:
    │       UPDATE order_items SET kot_printed = 1
    │       WHERE id IN (printed item IDs)
    │       UPDATE orders SET status = 'kot_sent'
    │
    └─► Return { success: true }
```

---

## 6. Backup Flow

```
─────────────── EXPORT ───────────────

User: Settings → Backup → Export Backup
    │
    └─► dialog.showSaveDialog() → user picks destination path
            │
            └─► backup:export { path }
                    │
                    ├─► db.pragma('wal_checkpoint(TRUNCATE)')
                    │   (flush all WAL writes to main DB file)
                    │
                    └─► fs.copyFileSync(pos.db → chosen path)
                            └─► Return { success: true }

─────────────── IMPORT ───────────────

User: Settings → Backup → Import Backup
    │
    └─► dialog.showOpenDialog() → user picks .sqlite file
            │
            └─► Confirmation dialog: "This will replace all current data"
                    │
                    └─► backup:import { path }
                            │
                            ├─► db.close()
                            │
                            ├─► fs.copyFileSync(pos.db → pos.db.bak)
                            │   (automatic rollback copy)
                            │
                            ├─► fs.copyFileSync(chosen path → pos.db)
                            │       │
                            │       └─► On failure:
                            │               fs.copyFileSync(pos.db.bak → pos.db)
                            │               throw original error
                            │
                            └─► Reopen DB connection
                                    └─► Return { success: true } or { success: false, error }
```

---

## 7. Business Session Flow

```
Start of business day:
    │
    └─► Admin: Dashboard → Open Business Session
            │
            └─► business-session:open { business_date, started_by }
                    │
                    ├─► Check for existing open session
                    │       └─► Found → return error (only one open at a time)
                    │
                    └─► INSERT business_sessions (status='open')
                            └─► All new orders/bills stamped with this business_date

End of business day:
    │
    └─► Admin: Dashboard → Close Business Session
            │
            └─► business-session:close { closed_by, notes }
                    │
                    └─► UPDATE business_sessions
                            SET status='closed', closed_at=NOW, closed_by=?
                            └─► New orders get NULL business_date until next session opens
```

---

## 8. Menu Scheduling Flow

```
Menu with schedule_enabled = 1 and time window set
    │
    └─► Frontend polling (or on page load)
            │
            └─► menu:getActiveMenu
                    │
                    ├─► Check current time against each menu's
                    │   auto_enable_time / auto_disable_time
                    │
                    └─► Return the menu whose time window matches current time
                            └─► Order screen loads that menu's categories and items
```
