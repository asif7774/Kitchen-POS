# Release Notes — v1.0

**Released:** June 2026
**Platform:** Windows 10+ · macOS 12+
**Status:** Live

---

## What's in v1.0

This is the first production release of Kitchen POS. The following features are fully built and in active use.

---

### Order & Table Management

- Create dine-in orders linked to specific tables
- Visual floor plan with real-time table status (available / occupied / bill requested)
- Add, edit, and remove items from open orders
- Per-item notes for kitchen instructions (e.g. "no onion", "extra spicy")
- Cover count tracking per order (number of guests)
- General order note that appears on the KOT slip
- View all currently open orders across all tables

---

### Kitchen Order Tickets (KOT)

- One-tap KOT printing to a USB thermal printer
- KOT shows table name, time, items, quantities, and special notes
- Only new or changed items print on each KOT — already-sent items are not reprinted
- Order status updates automatically from Open to KOT Sent after printing
- Retry dialog if printer is offline or out of paper

---

### Menu Management

- Multi-menu support — create, rename, and clone menus
- Categories with custom sort order
- Items with name, price, veg/non-veg indicator, and availability toggle
- Per-item GST rates (CGST % and SGST %) and HSN codes
- Unavailable items are hidden from the order screen immediately

---

### GST-Compliant Billing

- Sequential invoice numbers (INV-YYYY-XXXX) with no gaps
- Tax rates snapshotted at order time — historical bills are never affected by future rate changes
- Payment by cash, card, UPI, or complimentary
- Split payment across multiple methods in a single transaction
- Printed bill includes all legally required GST fields: taxable amount, CGST %, CGST amount, SGST %, SGST amount, grand total
- Optional discount per order

---

### Inventory

- Stock level tracking per ingredient with unit of measure
- Low-stock alert thresholds configurable per item
- Inventory log entries: purchase, sale (auto), adjustment, wastage
- Auto-deduction of stock when an order is billed (via menu-to-inventory mapping)
- Dashboard alert badge for low-stock items

---

### Staff & Shifts

- 4-digit PIN-based login for each staff member
- Four access roles: admin, manager, cashier, waiter
- PIN lockout after 3 wrong attempts (60-second cooldown)
- Shift open and close with opening and closing cash amounts
- Deactivate staff without deleting their history

---

### Customer Management

- Customer list with name and contact details
- Full order history per customer
- Outstanding balance tracking
- Balance settlement with payment recording

---

### Reports

- Daily sales summary (total revenue, order count, average order value)
- GST report with CGST and SGST breakdown for any date range
- Payment method breakdown (cash / card / UPI / complimentary)
- Hourly sales chart
- Date range filtering on all reports

---

### Past Orders

- Full order and bill history
- Browse and filter by date
- View complete item list and payment details for any historical order

---

### Expenses

- Daily expense logging with amount, category, and notes
- View expenses by date or category

---

### Dashboard

- Today's total sales and order count
- Live open table count
- Low-stock alert summary
- Quick navigation to common actions

---

### Settings & Backup

- Outlet name, address, and GSTIN configuration (appears on every printed bill)
- Printer test and connection configuration
- Manual one-click database export (.sqlite file)
- Manual one-click database import with automatic safety rollback on failure
- Scheduled end-of-day backup reminder

---

## Known Limitations in v1.0

| Limitation | Status |
|---|---|
| Single terminal only — no multi-device or LAN sync | Planned for v1.3 |
| One USB thermal printer per installation | No change planned |
| Backups are local files only — no cloud backup | Planned for v1.4 |
| No UPI QR code on printed receipts | Planned for v1.2 |
| KDS requires manual setup on a second monitor | Improved in v1.1 |
| No aggregator integration (Swiggy / Zomato) | Under consideration |

---

## Upgrade Notes

v1.0 is a fresh installation. There is no upgrade path from a prior version or from another POS system. All data must be entered manually or migrated via the backup import tool if moving from a compatible earlier build.
