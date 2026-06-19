# Kitchen POS — User Stories & Acceptance Criteria

Role-based user stories describing what each type of staff member needs from the system, and how to verify those needs are met.

---

## Admin

Admins have full access to every part of the system. They are typically the restaurant owner or a senior manager.

---

**As an admin, I want to configure the outlet name, GSTIN, and address so that all printed bills are legally compliant.**

Acceptance criteria:
- Settings screen has fields for outlet name, address, and GSTIN
- Saved values appear on every KOT and bill printed after the change
- GSTIN field accepts 15-character format; shorter values are flagged before saving
- Fields can be left blank for unregistered restaurants

---

**As an admin, I want to add and manage staff PINs so that each employee has their own secure login.**

Acceptance criteria:
- Can create a new staff member with name, 4-digit PIN, and role
- Can edit name, PIN, and role for any existing staff member
- Can deactivate a staff member — they can no longer log in but their historical orders remain linked to them
- Cannot delete a staff member who has orders in the system
- Three consecutive wrong PIN attempts at login results in a 60-second lockout

---

**As an admin, I want to export a database backup so that I can recover from hardware failure.**

Acceptance criteria:
- Settings → Backup → Export Backup opens a file chooser
- Chosen destination receives a valid `.sqlite` file
- File can be imported on the same or a different machine and restores the full system state
- Export completes in under 10 seconds for a typical day's data

---

**As an admin, I want to import a backup to restore the system so that I can recover from data loss.**

Acceptance criteria:
- Settings → Backup → Import Backup opens a file chooser
- A confirmation dialog warns that the current data will be replaced
- If import succeeds, the app reloads with the restored data
- If import fails (corrupt file, wrong format), the original data is automatically restored and an error message is shown
- The system keeps one automatic rollback copy before every import

---

**As an admin, I want to view GST reports for any date range so that I can prepare accurate tax filings.**

Acceptance criteria:
- Reports screen has a GST report section with date-range filter
- Report shows: taxable amount, total CGST collected, total SGST collected, and grand total for the selected period
- Report reflects only billed (paid) orders — open orders are excluded
- Date range with no orders returns zero values, not an error

---

**As an admin, I want to set up the menu with correct HSN codes and GST rates so that bills are legally accurate.**

Acceptance criteria:
- Each menu item has fields for HSN code, CGST rate (%), and SGST rate (%)
- Rates on existing items can be changed at any time
- Changing a rate does not alter any historical order or bill — only new orders use the new rate
- HSN code and rate appear on printed bills per line item

---

## Manager

Managers can access orders, menu, inventory, and reports but cannot change settings or manage staff.

---

**As a manager, I want to view daily sales totals so that I can track revenue without logging into a separate system.**

Acceptance criteria:
- Dashboard shows today's total sales amount and number of orders
- Reports → Daily Summary shows the same totals with a breakdown by payment method
- Figures update in real time as new orders are billed during the day

---

**As a manager, I want to manage the menu so that prices and availability stay current.**

Acceptance criteria:
- Can add new categories and items
- Can edit the name, price, HSN code, GST rate, and veg/non-veg flag of any item
- Can toggle any item as unavailable — it disappears from the order screen immediately
- Can reactivate an unavailable item — it reappears on the order screen immediately
- Changes to price or tax rate do not affect already-open orders

---

**As a manager, I want to see low-stock alerts so that I can reorder before running out.**

Acceptance criteria:
- Inventory screen highlights items where current stock is at or below the alert threshold
- Dashboard shows a count of low-stock items (if any)
- Alert threshold is configurable per inventory item

---

**As a manager, I want to log daily expenses so that we have a complete record of costs.**

Acceptance criteria:
- Can add an expense with amount, category, and optional notes
- Expenses are dated automatically to the day they are entered
- Can view expenses filtered by date or category

---

## Cashier

Cashiers handle payment and billing. They can see and manage orders and generate bills, but cannot access reports, settings, or staff management.

---

**As a cashier, I want to generate a GST bill so that the customer receives a legal invoice.**

Acceptance criteria:
- Tapping an occupied table and selecting "Generate Bill" opens the billing screen
- Bill shows: outlet name, GSTIN, address, sequential bill number, date and time, each item with HSN code and GST breakdown, and grand total
- Bill number follows the format INV-YYYY-XXXX with no gaps
- Bill is created only after payment is recorded

---

**As a cashier, I want to accept payment by cash, card, UPI, or complimentary so that I can handle any payment method.**

Acceptance criteria:
- Payment modal has buttons for cash, card, UPI, and complimentary
- Card and UPI payments can optionally record a reference number (card last 4 digits, UPI transaction ID)
- Complimentary marks the order as paid with zero amount collected
- Payment must equal the full bill amount — partial payment is not accepted (split payment is available instead)

---

**As a cashier, I want to accept split payment across multiple methods so that customers can pay part cash, part UPI.**

Acceptance criteria:
- Can add multiple payment entries in a single bill (e.g. ₹200 cash + ₹300 UPI)
- The total of all payment entries must equal the bill total before the bill can be confirmed
- Each payment method and amount appears separately on the printed receipt

---

**As a cashier, I want to print the bill receipt so that the customer has a physical copy.**

Acceptance criteria:
- Printing starts automatically when payment is confirmed, or can be triggered manually
- Receipt prints within 5 seconds on a connected USB thermal printer
- If the printer is offline, an error message appears with a retry option
- Receipt includes all required GST fields: taxable amount, CGST %, CGST amount, SGST %, SGST amount, grand total

---

**As a cashier, I want to look up past orders so that I can answer customer queries about previous visits.**

Acceptance criteria:
- Past Orders screen lists all historical orders with date, table, and amount
- Can filter by date
- Tapping an order shows the full item list and payment details

---

## Waiter

Waiters take orders and send them to the kitchen. They do not access billing, reports, or settings.

---

**As a waiter, I want to open a new order for a table so that I can take a customer's food order.**

Acceptance criteria:
- Tapping a green (available) table on the floor plan opens a new order for that table
- The table colour changes to amber immediately
- Order screen shows the full menu organised by category
- Can record the number of guests at the table

---

**As a waiter, I want to browse the menu and add items to an order so that I can take a complete order accurately.**

Acceptance criteria:
- Menu is organised by category with item name, price, and veg/non-veg indicator
- Tapping an item adds it to the current order
- Can increase or decrease quantity per item
- Can type a note per item (e.g. "no onion", "extra spicy")
- Only available items are shown

---

**As a waiter, I want to send a KOT to the kitchen so that the chef knows what to prepare.**

Acceptance criteria:
- Tapping "Send to Kitchen" prints a KOT slip immediately
- KOT shows: table name, current time, each item with quantity and any notes
- Only items not yet sent to the kitchen are printed — already-sent items are not repeated
- After successful print, order status changes to "KOT Sent"
- If the printer fails, an error appears with a retry option and no items are marked as sent

---

**As a waiter, I want to add items to an order after the KOT has been sent so that I can handle additions mid-meal.**

Acceptance criteria:
- Can add new items to an order even after KOT has been sent
- Sending to kitchen again prints only the newly added items
- Previously sent items are not reprinted

---

**As a waiter, I want to add a general note to an order so that the kitchen has context for special requests.**

Acceptance criteria:
- Order screen has a note field for the entire order (separate from per-item notes)
- Order note appears at the bottom of the KOT slip
- Note can be edited before the KOT is sent
