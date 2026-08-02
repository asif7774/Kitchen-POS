# Kitchen POS — Design Reference

> Screen-by-screen inventory of the Kitchen POS Electron application. Layout descriptions, UI elements, user actions, modal triggers, and navigation flows — intended as a reference for generating new designs in Stitch.

**16 screens · 18 modals · v1.0**

---

## Application Overview

| Aspect | Detail |
|---|---|
| Platform | Electron desktop (Mac/Windows) |
| Stack | React + TypeScript, SQLite (local), React Router (hash-based) |
| Styling | Tailwind CSS |
| Global layout | Fixed left sidebar + dynamic top header + scrollable content area |
| Floating element | Quick Actions FAB (bottom-right, outside Router) |

### Startup Flow

```
First launch  →  /setup
Every login   →  /login  (PIN pad)
Shift enabled & no active shift  →  OpenShift modal (blocks navigation)
Default route  →  /dashboard
```

### Sidebar Navigation

Dashboard · Tables · KDS *(conditional on setting)* · Expenses · Customers · Staff · Menu · Inventory · Reports · Past Orders · Settings

### Feature Toggles (in Settings)

- GST / SGST billing
- Shift register tracking
- KDS display (shows/hides KDS in sidebar)
- Auto-debit inventory on KOT

---

## Auth & Setup

### Initial Setup — `/setup`

**One-time onboarding wizard. Shown only on first launch.**

**Layout:** Centered card (max-width 448 px) on plain light-gray background. Single-column form. No sidebar or nav. Two logical groups: Restaurant Identity and Admin User.

**Form fields**

| Field | Type | Notes |
|---|---|---|
| Restaurant Name | Text | Required |
| Admin Name | Text | Default "Admin" |
| Admin PIN | Password | 4 digits, `maxLength=4` |

**Behaviour**
- Validates all fields before submit
- On success: calls `api.system.completeSetup()` + `api.system.generateRecoveryCode()`, redirects to `/login`
- Form is disabled during submission

**Navigation:** First Launch → `/setup` → `/login`

---

### Login — PIN Pad — `/login`

**Full-screen PIN authentication on every app launch and after session expiry.**

**Layout:** Full-screen centered. Two decorative radial blur elements (top-left emerald, bottom-right yellow). Content stack: logo → app name → PIN pad → footer actions. No sidebar or top header.

**Key UI elements**

- App logo (80×80 rounded square with shadow)
- Title: "Kitchen POS" (large, gradient text)
- Subtitle: "Fast. Simple. Efficient."
- PIN pad: 4-dot indicator row + 3×4 numeric grid + backspace key
- Forgot PIN? ghost button
- Export Backup / Import Backup outline buttons (grouped, bottom of screen)

**User actions**

| Action | Result |
|---|---|
| Enter 4-digit PIN | Authenticates; redirects to `/dashboard` |
| Forgot PIN? | Opens Recovery modal |
| Export Backup | File save dialog → downloads ZIP |
| Import Backup | Confirmation modal → overwrites data + restarts app |

**Modals triggered:** Recovery Modal · Import Backup Confirm

---

## Core Operations

### Table Management — `/tables`

**Real-time bird's-eye view of the dining floor. Polls every 5 seconds.**

**Layout:** Responsive grid of TableStatusCard components — 3 cols → 4 → 5 → 6 at wider breakpoints. Header shows total table count and occupied count.

**Table card anatomy**

- Table name (e.g. "T1") + custom name if set
- Capacity (seats icon + number)
- Status indicator (colour-coded dot or card border)
- Customer name (if an order is assigned)
- Occupied duration timer (if occupied)
- Overflow menu: Edit, Delete

**Table status states**

| Status | Visual | Condition |
|---|---|---|
| Available | Green tint | No active order |
| Occupied | Blue tint | Active order in progress |
| Bill Requested | Amber tint | Order status = `billed`, awaiting payment |

**User actions**

| Action | Result |
|---|---|
| Click table card | Navigate to `/order/:tableId` |
| Header "Add Table" | Add Table modal |
| Card → Edit | Edit Table modal |
| Card → Delete | Delete confirmation modal |

**Modals triggered:** Add Table · Edit Table · Delete Confirm

---

### Order Page — `/order/:tableId`

**Core POS screen. Handles dine-in tables (`tableId > 0`) and takeaway/delivery (`tableId = 0`).**

**Layout:** Two-panel split filling the full screen height.

- **Left panel (`flex-1`):** Menu browsing — category navigation + item grid. `bg-gray-50`. Scrollable.
- **Right panel (`w-96` fixed):** Current order cart. `bg-white`. Left shadow. Internal scroll for cart items only.

**Left panel — Menu**

- Back to Tables button (absolute top-left; hidden for tableId=0)
- Menu selector dropdown (only shown if multiple menus exist)
- Category tabs/list
- Item cards: name, price, image, veg/non-veg indicator dot
- Tap item → add to cart (increments qty if already in cart)

**Right panel — Cart**

- Header: "Current Order" + occupied time badge (clock icon + HH:MM)
- Table identifier pill + pencil (rename) button — or order-type `<select>` for tableId=0 (Takeaway / Delivery)
- Customer assign dropdown (optional, CustomerSelect component)
- **Unsent items section:** qty stepper · note input · void (×) per item
- **Sent KOT groups section:** read-only collapsed list of previously sent items
- Footer actions: Send KOT · Generate Bill · Void Order

**KOT workflow**

```
Add Items → Send KOT → KDS receives → (kitchen prepares) → Generate Bill → Complete
```

**Business rules**

- Cannot generate bill if no KOT has been sent yet
- Cannot generate bill if unsent items remain in cart
- Send KOT has an optional "print KOT" toggle
- After bill completion: dine-in navigates to `/tables`; takeaway does `window.location.reload()`

**Modals triggered:** Rename Table (inline) · Void Item · Void Order · Generate Bill *(size: xl)*

---

### Kitchen Display System — `/kds`

**Full-screen dark-theme display for kitchen wall monitors.**

**Layout:** Full-screen `bg-gray-950`. Fixed header bar with live clock. Horizontally scrolling ticket lane filling remaining height. Tickets never wrap — they scroll sideways. No sidebar or app shell.

**Ticket card anatomy**

- Fixed width 320 px. Max-height 85 vh with internal scroll.
- Header: table name · order ID · order-type badge · wait-time badge (top-right)
- Items list: `qty × name`, note in amber italic, status badge per item
- Footer: **All Ready** + **All Served** bulk-action buttons

**Item preparation states**

| Status | Colour |
|---|---|
| Pending | Red |
| Preparing | Orange |
| Ready | Green |
| Served | Gray |

Click an item's status badge to cycle through: Pending → Preparing → Ready → Served

**Wait-time urgency**

| Time | Visual |
|---|---|
| 0–14 min | Neutral gray badge |
| 15–29 min | Amber badge; card header turns amber |
| 30+ min | Red badge; header pulses (CSS animation) |

**Order-type badges:** Dine-in = emerald · Takeaway = orange · Delivery = purple

**Refresh:** Auto-refresh every 5 s + live clock tick every 1 s

**Empty state:** Centered illustration + "No Pending Orders" heading + helper text

---

## Reporting & History

### Dashboard — `/dashboard`

**At-a-glance business health overview with charts.**

**Header controls:** Segmented time filter — Today / Yesterday / Weekly / Monthly / Yearly (active item highlighted emerald)

**KPI cards (5, horizontal row)**

| Card | Accent | Metric |
|---|---|---|
| Total Sales | Blue | ₹ revenue |
| Orders | Green | Count |
| Avg Order Value | Purple | ₹ |
| Customers | Orange | Count |
| Customer Dues | Blue | ₹ outstanding |

Each card includes: icon, value, trend % vs last period, mini sparkline.

**Charts**

| Chart | Type | Notes |
|---|---|---|
| Sales Trend | Bar / Line toggle | Full-width; tooltip shows revenue + orders |
| Top Selling Items | Donut / Pie | With legend and % labels |
| Customer Traffic by Hour | Bar | Orange bars |
| Peak Hour Revenue | Bar | Purple bars |

**Layout:** KPI row spans full width (5-col grid at `lg`). Charts below: Sales Trend spans 3 cols; Top Items, Traffic, Revenue take 1 col each.

---

### Past Orders — `/past-orders`

**Paginated log of all completed orders.**

**Header controls:** Segmented filter: Daily / Weekly / Monthly / Yearly. Subtitle: "N Orders Total · Total Revenue: ₹X"

**KPI cards (3)**

| Card | Accent |
|---|---|
| Total Revenue ₹ | Blue |
| Total Orders | Green |
| Average Order Value ₹ | Purple |

**Table columns**

| Column | Notes |
|---|---|
| Business Date | Monospace |
| Date & Time | Locale string with timezone |
| Customer | Name or — |
| Type | DINE-IN / TAKEAWAY / DELIVERY pill badge |
| Amount | ₹, right-aligned, bold |
| Occupied Time | HH:MM monospace |
| Details | View / Hide toggle |

**Expanded row:** Green-tint background row below. Shows item list (name + qty) on the left, **Print Bill** button on the right.

**Pagination:** 15 items per page. "Page X of Y" + Previous / Next. Only visible when `totalPages > 1`.

---

### Sales Reports — `/reports`

**Detailed revenue breakdown with CSV export. KPI cards adapt to GST setting.**

**Header controls**

- Segmented filter: Daily / Weekly / Monthly / Yearly
- "Custom Dates" → inline dropdown with Start + End date inputs
- "Export CSV" → downloads `sales_report_{filter}.csv`

**KPI cards — GST enabled (4)**

Total Orders · Total Sales ₹ · Total CGST ₹ · Total SGST ₹

**KPI cards — GST disabled (4)**

Total Orders · Total Sales ₹ · Avg Order Value ₹ · Peak Hour Revenue ₹

**Revenue Trend chart:** Full-width bar chart. Blue bars with rounded tops. Tooltip shows revenue + order count. Y-axis has ₹ prefix.

---

## Menu & Inventory

### Menu Management — `/menu`

**Full CRUD for menus, categories, and individual dishes. Supports multiple named menus with scheduling.**

**Top bar**

- Menu selector dropdown (marks default menu)
- "+ New Menu" outline button
- "Edit & Schedule" button (for active menu)
- "Duplicate" button (clones current menu)

**Two-column layout**

- **Left (1/3):** Category list card with Add button. Clickable rows to filter items by category. Edit action per row.
- **Right (2/3):** Menu items for the selected category. Item cards with toggle, Edit, Recipe, and Add actions.

**Menu item card**

- Thumbnail image
- Name and price (₹)
- Veg/non-veg dot (green = veg, red = non-veg)
- Available / Unavailable toggle
- Edit + Recipe buttons

**Modals triggered:** New/Edit Menu (with scheduling) · Clone Menu · Add/Edit Category · Add/Edit Dish · Recipe (ingredient linking)

---

### Inventory Management — `/inventory`

**Track raw ingredient stock. Used with recipes to auto-debit on KOT.**

**Header controls:** Search bar (by item name) + "+ Add Item" primary button

**Table columns**

| Column | Notes |
|---|---|
| Item Name | Bold |
| In Stock | qty + unit; red text if at/below alert threshold |
| Cost/Unit | ₹ |
| Status | **Healthy** (green badge) or **Low Stock** (red badge) |
| Actions | Adjust Stock · Edit Details |

**Low stock condition:** `qty_in_stock ≤ low_stock_alert_at`

**Modals triggered:** Add/Edit Inventory Item · Adjust Stock

---

## Customers

### Customer List — `/customers`

**Master list with search, outstanding balance tracking, and settlement.**

**Header controls**

- Autosearch (name, email, or phone)
- "Add Customer" primary button
- Subtitle: "N Customers · Total Outstanding: ₹X"

**Table columns**

| Column | Notes |
|---|---|
| Name + Email | Two-line cell |
| Phone | |
| Credit Limit | ₹ |
| Outstanding | ₹ — red if > 0, green if 0 |
| Total Spend | ₹ |
| Actions | History · Settle *(if outstanding > 0)* · Edit · Delete |

**Navigation**

| Action | Destination |
|---|---|
| Add Customer | `/customers/new` |
| Edit | `/customers/:id` |
| History | `/customers/:id/history` |

**Modals triggered:** Settle Balance · Delete Confirm

---

### Customer Detail — `/customers/:id` · `/customers/new`

**Single form for create and edit. Same component — mode detected by the `:id` param.**

**Layout:** Constrained single-column form (max-width 672 px), centred. White card with gray header bar. Back link at top.

**Form fields**

| Field | Type |
|---|---|
| Name | Text, required, autofocus |
| Phone Number | Text |
| Email | Email |
| Credit Limit ₹ | Number, step 0.01 + helper text |

**Actions:** Cancel · Save Customer (right-aligned)

---

### Customer History — `/customers/:id/history`

**Order history scoped to a single customer.**

**Layout:** Similar to Past Orders page, scoped to one customer. Customer name shown in header. Back button to `/customers`.

---

## Operations

### Staff Management — `/staff`

**Directory of staff with role-based colour coding and PIN assignment.**

**Header controls:** Autosearch (name or role) + "+ Add Staff" primary button

**Table columns:** Name · Role (badge) · Actions (Edit, Delete)

**Role colour system**

| Role | Colour |
|---|---|
| Admin | Purple |
| Manager | Emerald |
| Cashier | Green |
| Waiter | Yellow / Amber |
| Chef | Orange |
| Cleaner | Gray |

**Modals triggered:** Add Staff · Edit Staff · Delete Confirm

---

### Expenses — `/expenses`

**Track operational expenses by category with date filtering.**

**Header controls**

- Segmented filter: Daily / Weekly / Monthly / Yearly
- "Custom Dates" → inline dropdown with Start + End date inputs + Apply Range button
- "+ Add Expense" primary button

**Summary card (above table)**

- "Expense Overview" label (left)
- "Total Expenses / ₹X" highlight (right, green-tint background, blue border)

**Table columns**

| Column | Notes |
|---|---|
| Date | |
| Category | Rounded gray pill badge |
| Description | Optional emerald staff-link badge below if linked |
| Amount | ₹, right-aligned, bold |
| Delete | Red ghost button |

**Modals triggered:** Add Expense · Delete Confirm

---

## Settings — `/settings`

**Single scrollable page of stacked cards. Max-width 672 px, centred. No sub-navigation.**

### Card 1 — Data & Backups

**Manual**
- Back Up Now button
- Export Backup button (downloads ZIP including images)
- Import Backup button → confirmation modal → overwrites data + restarts

**Auto-Backup** (toggle)
- Frequency: Daily / Weekly
- Backup folder selector
- Last backup timestamp display

**Backup Reminder** (toggle)
- Frequency: Daily / Weekly / Monthly
- Time picker
- Day-of-week selector (weekly) or day-of-month (monthly)

---

### Card 2 — Outlet Details

| Field | Type |
|---|---|
| Outlet Name | Text |
| GSTIN | Text with format hint |

---

### Card 3 — Printer

**Test Print** button → sends a test KOT to the connected printer.

---

### Card 4 — Security

**Change My PIN**

| Field | Type |
|---|---|
| Current PIN | Password + eye toggle |
| New PIN | Password + eye toggle, enforces 4 digits |

Update PIN button — disabled until both fields are filled.

**PIN Recovery:** Generate New Recovery Code button.

---

### Card 5a — Taxes & Billing

- Enable GST / SGST toggle

### Card 5b — Inventory Settings

- Auto-Debit Inventory on KOT toggle

### Card 5c — General Preferences

- Enable Notifications toggle
- Dark Mode toggle
- Enable KDS toggle (shows/hides KDS in sidebar)
- Enable Shift Register toggle (requires open shift to take orders)

---

### Card 6 — Shift Register *(hidden if shift tracking is disabled)*

- Current shift status: "Open since [timestamp]" or "Closed"
- Close Shift Register button → Close Shift modal

---

### Danger Zone

Factory Reset button (danger variant). Confirmation modal — user must type the word **`reset`**. Irreversible: wipes all data, returns app to `/setup`.

---

## Modals & Overlays

All modals use the shared `Modal` component: title bar + body slot + footer actions row.

**Sizes:** default (448 px) · `lg` (640 px) · `xl` (800 px)

---

### Open Shift

*Shown on login if shift tracking is enabled and no active shift exists. Blocks all navigation.*

| Field | Type |
|---|---|
| Opening cash balance | ₹ number input |
| Notes | Optional textarea |

**Actions:** Open Shift (primary)

---

### Close Shift

*Settings → Shift Register card → Close Shift Register*

| Field | Notes |
|---|---|
| Closing cash balance | ₹ number input |
| Expected cash in drawer | System-calculated, read-only |
| Discrepancy | Over / short display |

**Actions:** Reconcile & Close Shift (danger) · Cancel

---

### Generate Final Bill *(size: xl)*

*Order Page → Generate Bill*

**Content:** Full item summary · Subtotal / CGST / SGST / Grand Total · Customer assign or change · Discount input (₹ or %) · Credit/on-account toggle (if customer has credit) · Payment method selector

**Actions:** Complete & Save (secondary) · Print Receipt (primary) · Cancel

---

### Void Item / Void Order

*Order Page → × on item row, or Void Order button*

| Field | Type |
|---|---|
| Cancellation reason | Textarea |

**Actions:** Confirm Void (danger) · Go Back

---

### Add / Edit Table

| Field | Type |
|---|---|
| Table Name | Text (e.g. T1, T2) |
| Capacity | Number |

**Actions:** Create / Update · Cancel

---

### New / Edit Menu

| Field | Type |
|---|---|
| Menu Name | Text |
| Set as Default | Toggle |
| Schedule enabled | Toggle |
| Days of week | Checkboxes (Mon–Sun) |
| Start time / End time | Time inputs |

**Actions:** Create / Save · Cancel

---

### Add / Edit Dish

| Field | Type |
|---|---|
| Name | Text |
| Price | ₹ number |
| Image | File picker → thumbnail preview |
| Category | Select |
| Is Vegetarian | Toggle |
| Is Available | Toggle |
| Description | Textarea |

**Actions:** Save Dish · Cancel

---

### Recipe — Ingredient Linking *(size: lg)*

*Menu Item List → Recipe button*

- Rows of: inventory item select + quantity input
- "+ Add Ingredient" row button
- Remove (×) per row
- Links dish to inventory items for auto-debit when a KOT is sent

**Actions:** Save Recipe · Cancel

---

### Clone Menu

| Field | Notes |
|---|---|
| New menu name | Pre-filled "Copy of X" |

Duplicates all categories and items from the source menu.

---

### Add / Edit Category

| Field | Type |
|---|---|
| Category Name | Text |

**Actions:** Save · Cancel

---

### Settle Customer Balance

| Field | Type |
|---|---|
| Customer name + current outstanding | Read-only display |
| Amount to settle | ₹ number input |
| Payment method | Select |

**Actions:** Settle Balance · Cancel

---

### Add / Edit Staff

| Field | Type |
|---|---|
| Name | Text |
| Role | Select (admin / manager / cashier / waiter / chef / cleaner) |
| PIN | 4-digit number |

**Actions:** Save Staff · Cancel

---

### Add Expense

| Field | Type |
|---|---|
| Date | Date picker |
| Category | Text (free-form) |
| Amount | ₹ number |
| Description | Text |
| Staff link | Optional select |

**Actions:** Save Expense · Cancel

---

### Add / Edit Inventory Item

| Field | Type |
|---|---|
| Name | Text |
| Unit | Text (kg / g / L / pcs…) |
| Cost per Unit | ₹ number |
| Low Stock Alert at | Number threshold |

**Actions:** Save Item · Cancel

---

### Adjust Stock

| Field | Notes |
|---|---|
| Adjustment type | Add / Remove select |
| Quantity | Number |
| Reason | Text |
| Current stock | Read-only display |

**Actions:** Confirm · Cancel

---

### PIN Recovery

*Login → Forgot PIN?*

| Field | Type |
|---|---|
| Recovery code | 6-character input |

On success: resets admin PIN to a new user-specified value.

---

### Factory Reset Confirm

User must type **`reset`** into a text input before the confirm button enables. Triggers full data wipe and redirects to `/setup`.

---

## Key Data Models

Field names as they appear in the TypeScript type system.

### Table

```ts
id: number
name: string
custom_name: string | null
capacity: number
// status derived from active orders
```

### Order

```ts
id: number
table_id: number
customer_name: string | null
status: 'open' | 'billed' | 'completed'
type: 'dine-in' | 'takeaway' | 'delivery'
created_at: string
```

### KDSTicketItem

```ts
id: number
name: string
qty: number
note: string | null
preparation_status: 'pending' | 'preparing' | 'ready' | 'served'
```

### Customer

```ts
id: number
name: string
phone: string | null
email: string | null
credit_limit: number
outstanding_balance: number
total_spend: number
```

### Staff

```ts
id: number
name: string
role: 'admin' | 'manager' | 'cashier' | 'waiter' | 'chef' | 'cleaner'
is_active: boolean
```

### MenuItem

```ts
id: number
name: string
price: number
image: string | null
category_id: number
is_vegetarian: boolean
is_available: boolean
```

### InventoryItem

```ts
id: number
name: string
unit: string
qty_in_stock: number
cost_per_unit: number
low_stock_alert_at: number
```

### Expense

```ts
id: number
date: string
category: string
amount: number
description: string | null
staff_id: number | null
staff_name: string | null
```
