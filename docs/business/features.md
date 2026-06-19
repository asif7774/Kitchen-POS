# Kitchen POS — Features Reference

A plain-language description of every feature in Kitchen POS. Each section describes what the feature does and what staff can do with it.

---

## 1. Order Management

Take and manage food orders from the moment a customer sits down to the moment they pay.

**What staff can do:**
- Open a new order for any table or as a takeaway
- Browse the menu by category and add items to the order
- Set quantities, add special instructions per item (e.g. "no onion", "extra spicy")
- Edit or remove items while the order is still open
- Record how many guests are at the table (covers)
- Add a general note for the kitchen about the entire order
- View all currently open orders across all tables

---

## 2. Table Management

See the status of every table in your restaurant at a glance on a visual floor plan.

**What staff can do:**
- View all tables with colour-coded status:
  - **Green** — table is free
  - **Amber** — table has an open order
  - **Red** — bill has been requested
- Tap any table to open its order or start a new one
- Organise tables into sections (e.g. Main Hall, Outdoor, AC Room)
- Add, rename, or remove tables from the floor plan
- Set seating capacity per table

---

## 3. Menu Management

Build and maintain your restaurant's menu with full control over categories, items, prices, and availability.

**What staff can do:**
- Create and organise menu categories (e.g. Starters, Main Course, Beverages)
- Add menu items with name, price, veg or non-veg flag, HSN code, and GST rate
- Toggle any item as available or unavailable — unavailable items are hidden from the order screen instantly
- Adjust sort order of categories and items
- Create multiple menus (e.g. Dine-In Menu, Takeaway Menu) and clone menus to reuse

---

## 4. GST Billing

Generate fully legal GST-compliant invoices for every transaction.

**What staff can do:**
- Generate a bill from any occupied table with one tap
- Apply a discount to the order if needed
- Accept payment by cash, card, UPI, or complimentary (no charge)
- Split payment across multiple methods (e.g. part cash, part UPI)
- Print the GST bill receipt to the thermal printer

**What the bill includes:**
- Your outlet name, address, and GSTIN
- Sequential bill number (INV-YYYY-XXXX) — no gaps, no duplicates
- Date and time
- Each item with HSN code, quantity, rate, and amount
- Taxable amount, CGST percentage and amount, SGST percentage and amount
- Grand total

---

## 5. KOT Printing (Kitchen Order Tickets)

Send order details directly to the kitchen printer so chefs know exactly what to prepare.

**What staff can do:**
- Tap "Send to Kitchen" to print a KOT slip for any open order
- Only new or changed items print — items already sent are not reprinted
- Add a general note that appears on the KOT slip
- Retry if the printer is offline or out of paper

**What the KOT slip shows:**
- Table name and time
- Each item with quantity and any special instructions

---

## 6. Inventory Tracking

Keep track of your ingredients and supplies so you never run out unexpectedly.

**What staff can do:**
- Add inventory items with unit of measure (kg, litre, piece, etc.)
- Set a low-stock alert level — the system highlights items below this level
- Log purchases to add stock
- Log wastage or manual adjustments
- Link menu items to ingredients so stock deducts automatically when an order is billed

---

## 7. Staff Management

Manage who works at your restaurant and what they can access.

**What admins can do:**
- Add staff members with a name, 4-digit PIN, and role
- Assign one of four roles:
  - **Admin** — full access to all features including settings and reports
  - **Manager** — access to menu, inventory, reports, and orders
  - **Cashier** — access to orders and billing
  - **Waiter** — access to order-taking only
- Deactivate staff who no longer work at the restaurant (their history is preserved)
- Track shift open and close times with opening and closing cash amounts

---

## 8. Reports

Get a clear picture of your restaurant's performance without needing a separate accounting tool.

**What managers and admins can do:**
- View the **daily sales summary** — total revenue, number of orders, average order value
- View the **GST report** — taxable amount, total CGST, total SGST for any date range
- View the **payment breakdown** — how much was collected by cash, card, UPI, and complimentary
- View the **hourly sales chart** — see which hours are busiest
- Filter all reports by date or date range

---

## 9. Past Orders

Look up any order or bill from your restaurant's history.

**What staff can do:**
- Browse all past orders with date, table, amount, and status
- Search and filter by date or order details
- View the full item list and payment details for any past order

---

## 10. Customer Management

Maintain a list of your regular customers and track their relationship with your restaurant.

**What staff can do:**
- Add customers with name and contact details
- View a customer's full order history
- Track outstanding balances (credit extended to customers)
- Settle a customer's balance and record payment

---

## 11. Expense Tracking

Log your daily restaurant expenses so you have a complete picture of costs.

**What staff can do:**
- Add an expense entry with amount, category, and notes
- View expenses by date
- Track categories such as groceries, utilities, maintenance, etc.

---

## 12. Kitchen Display Screen (KDS)

Show pending kitchen orders on a second screen so chefs don't need paper slips.

**What it does:**
- Displays all open KOT orders on a dedicated screen in the kitchen
- Orders appear automatically when sent from the billing terminal
- Removes orders when they are completed or billed

---

## 13. Dashboard

See today's key numbers the moment you open the app.

**What it shows:**
- Total sales for today
- Number of orders taken today
- Open tables at this moment
- Low-stock alerts (if any)
- Quick links to common actions

---

## 14. Settings

Configure the system to match your restaurant's details and preferences.

**What admins can do:**
- Set outlet name, address, and GSTIN (appears on every printed bill)
- Configure and test the thermal printer connection
- Set up automatic end-of-day backup reminders
- Manage the backup schedule

---

## 15. Backup & Restore

Protect your data with a simple one-click backup system.

**What admins can do:**
- **Export backup** — saves the entire database as a single file to any location (USB drive, external disk, etc.)
- **Import backup** — restores from a previously exported file
- The system keeps one automatic safety copy before any import — if something goes wrong, your data is safe

**Recommended practice:** Export a backup at the end of every business day and store it on a USB drive kept separately from the computer.
