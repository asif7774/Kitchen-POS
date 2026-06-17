# Restaurant POS

A modern, offline-first point-of-sale system for restaurants. Runs entirely on the local machine — no internet required, no monthly subscription, no cloud dependency.

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue)
![Stack](https://img.shields.io/badge/stack-Electron%20%2B%20React%2019%20%2B%20SQLite-purple)
![GST](https://img.shields.io/badge/GST-compliant%20India-green)
![Offline](https://img.shields.io/badge/offline-first-orange)

---

## Features

- **Order management** — Create orders, add items, send KOT to kitchen printer
- **Table management** — Visual floor plan with real-time status (available / occupied / bill requested)
- **Menu management** — Categories, items, veg/non-veg flag, availability toggle
- **GST-compliant billing** — CGST + SGST per line item, HSN codes, sequential invoice numbers
- **Thermal printer support** — Direct USB ESC/POS printing for KOT slips and GST bills
- **Inventory tracking** — Stock levels, auto-deduction on sale, low-stock alerts
- **Staff management** — PIN-based login, role-based access (admin / manager / cashier / waiter), shift tracking
- **Reports** — Daily summary, GST report, payment method breakdown, hourly charts
- **Backup & restore** — One-click export/import of the full database as a single file
- **Offline-first** — SQLite embedded database, zero internet dependency

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Desktop shell | Electron | 30+ |
| UI framework | React | 19.2.7 |
| Language | TypeScript | 6.0.3 |
| Build tool | Vite | 8.0.16 |
| Styling | Tailwind CSS 4 | 4.3.1 |
| Component architecture | Atomic Design (atoms → organisms → pages) | — |
| Routing | React Router | 7.17.0 |
| State | Zustand | — |
| Database | SQLite via `better-sqlite3` | — |
| Testing | Vitest | 4.1.8 |
| Linting | ESLint 10 + Prettier 3.8 | — |
| Git hooks | Husky + lint-staged | — |
| Printing | `escpos` + `escpos-usb` | — |
| Packaging | electron-builder (NSIS / DMG) | — |

---

## Project structure

```
pos/
├── frontend/                  # React renderer process
│   ├── src/
│   │   ├── components/
│   │   │   ├── atoms/         # Base UI: Button, Input, Badge, SVG sprite loader
│   │   │   ├── molecules/     # Composed: FormField, TableCard, MenuItemRow
│   │   │   └── organisms/     # Complex: Header, Navigation, Global Modals
│   │   ├── layouts/           # App shell, sidebar, header
│   │   ├── pages/             # Route-level components
│   │   │   ├── Order/         # Each page MUST have its own folder
│   │   │   │   ├── components/# Page-specific components go here
│   │   │   │   └── index.tsx  # Main page entry
│   │   ├── contexts/          # React context providers
│   │   ├── modules/           # Feature logic per domain
│   │   │   ├── orders/
│   │   │   ├── tables/
│   │   │   ├── menu/
│   │   │   ├── inventory/
│   │   │   ├── staff/
│   │   │   ├── reports/
│   │   │   ├── billing/
│   │   │   └── settings/
│   │   ├── store/             # Zustand state slices
│   │   ├── lib/               # ipc-client.ts, formatters, tax-calc
│   │   └── main.tsx
│   ├── icons/                 # SVG source icons (used by generate-sprite script)
│   ├── public/                # favicon.svg, manifest.webmanifest, sprite.svg
│   ├── scripts/               # generate-svg-sprite.js
│   ├── index.html
│   ├── vite.config.ts         # Port 5200, Terser, manual chunk splitting
│   ├── tailwind.config.js
│   ├── vitest.config.ts
│   └── package.json
│
├── backend/                   # Electron main process (Node.js)
│   ├── src/
│   │   ├── main.ts            # App entry, BrowserWindow, IPC registration
│   │   ├── preload.ts         # contextBridge API surface (window.api)
│   │   ├── ipc/               # One file per domain
│   │   │   ├── orders.ts
│   │   │   ├── menu.ts
│   │   │   ├── tables.ts
│   │   │   ├── inventory.ts
│   │   │   ├── staff.ts
│   │   │   ├── reports.ts
│   │   │   ├── billing.ts
│   │   │   ├── printer.ts
│   │   │   └── backup.ts
│   │   ├── db/
│   │   │   ├── index.ts       # SQLite singleton (WAL mode)
│   │   │   ├── migrate.ts     # Auto-runs migrations on startup
│   │   │   └── migrations/    # 001_init.sql, 002_seed.sql ...
│   │   └── services/
│   │       ├── printer.ts     # escpos-usb wrapper
│   │       ├── backup.ts      # export/import .sqlite file
│   │       └── gst.ts         # Tax calculation helpers
│   └── tsconfig.json
│
├── assets/                    # icon.ico, icon.icns, icon.png
├── .vscode/                   # launch.json, settings.json, extensions.json
├── electron-builder.yml
├── package.json               # Root — workspaces + dev runner
├── ARCHITECTURE.md            # Full technical specification
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later (per Vital's `engines` field)
- [Git](https://git-scm.com/)
- A USB ESC/POS thermal printer (for printing features)
- Windows 10+ or macOS 12+

---

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/restaurant-pos.git
cd restaurant-pos
```

### 2. Install dependencies

```bash
# Root dependencies (Electron, electron-builder, concurrently)
npm install

# Frontend dependencies
npm install --prefix frontend

# Backend dependencies
npm install --prefix backend
```

### 3. Build the backend (TypeScript compile)

```bash
npm run build --prefix backend
```

### 4. Start in development mode

```bash
npm run dev
```

This starts three processes concurrently:
- Vite dev server for the React frontend at `http://localhost:5200`
- TypeScript compiler (watch mode) for the backend
- Electron loading the app

---

## Frontend dev commands

These run from the `frontend/` directory (or with `--prefix frontend` from root):

```bash
npm run dev          # Start Vite dev server on :5200
npm run build        # tsc + vite build → dist/
npm run preview      # Preview production build
npm run test         # Run Vitest once
npm run test:ui      # Run Vitest with browser UI
npm run lint         # ESLint
npm run tsc          # Type-check only (no emit)
npm run generate-sprite  # Rebuild SVG sprite from icons/
```

---

## First-time setup

When the app opens for the first time:

1. Log in with the default admin PIN: **`1234`**
2. Go to **Settings** and fill in your outlet name, address, and GSTIN
3. Go to **Settings → Printer** and click **Test Print** to verify your thermal printer
4. Go to **Menu** and add your categories and items with correct HSN codes and GST rates
5. Go to **Tables** and configure your floor plan
6. **Change the admin PIN immediately** — Settings → Staff → Edit

> The default PIN `1234` is a seed value for first run only. Change it before going live.

---

## Building for distribution

```bash
npm run build      # Compile frontend + backend
npm run package    # electron-builder → dist-electron/
```

**Windows:** `dist-electron/Restaurant POS Setup x.x.x.exe` (NSIS installer)

**macOS:** `dist-electron/Restaurant POS-x.x.x.dmg`

> macOS builds require code signing and notarization for distribution outside your own machine. See [electron-builder code signing docs](https://www.electron.build/code-signing).

---

## Backup and restore

### Export backup

Settings → Backup → **Export Backup**

Copies the raw `.sqlite` database file to your chosen location. Full fidelity — no data is lost. Do this at the end of every business day.

### Import backup

Settings → Backup → **Import Backup**

Replaces the current database with the selected `.sqlite` file. **This is irreversible.** The app keeps one automatic rollback copy (`.sqlite.bak`) in case the import fails.

**Recommended routine:** Daily export to a USB drive or external storage. Keep at least 7 days of backups.

---

## Thermal printer setup

Direct USB ESC/POS — no print drivers needed.

**Tested printers:** Epson TM-T82, TVS RP3200, Xprinter XP-58, Rongta RP400

**Windows:** If the printer is not detected, uninstall any manufacturer drivers and let Windows use its generic USB class driver.

**macOS:** Grant USB device access when prompted on first launch.

To verify: Settings → Printer → **Test Print**

---

## GST compliance notes

- Each menu item stores its own **CGST rate**, **SGST rate**, and **HSN code**
- Tax rates are **snapshotted onto each order item** at the time of ordering — changing a rate later won't affect historical bills
- Invoice numbers are sequential with no gaps (`INV-YYYY-XXXX`) as required for GST audit
- Bills print: taxable amount, CGST %, CGST amount, SGST %, SGST amount, grand total — all as separate line items

> This software generates GST-compliant invoices. Consult your CA for filing and compliance obligations specific to your business.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `F1` | New order |
| `F2` | Table floor plan |
| `F4` | Menu management |
| `F10` | Reports |
| `Esc` | Close current modal |

---

## Development conventions

- **Component placement:** Follow Atomic Design for global components (`atoms/`, `molecules/`, `organisms/`). 
- **CRITICAL RULE FOR PAGES:** Every page/module MUST be placed in its own dedicated directory inside `src/pages/` (e.g., `src/pages/Order/`). Each page folder MUST contain a `components/` subfolder where all page-specific components are stored. Never clutter the global `src/components/` folder with components that are only used in a single page.
- **Path aliases:** Configured via `tsconfigPaths` in `vite.config.ts`. Use `@/` for `src/`.
- **SVG icons:** Add source SVGs to `icons/`, then run `npm run generate-sprite` to rebuild the sprite. Use `<SvgSpriteLoader />` atom to render icons.
- **New IPC channel:** Add handler in `backend/src/ipc/<module>.ts`, register it in `backend/src/main.ts`, expose it in `preload.ts`, type it in `frontend/src/lib/ipc.ts`.
- **Database changes:** Always create a new migration file `backend/src/db/migrations/00X_description.sql`. Use `IF NOT EXISTS` — migrations are idempotent.
- **Never import Node.js in the frontend.** `fs`, `path`, `better-sqlite3` live in the backend only. Use `window.api` (IPC) for everything.

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- Full database schema
- IPC channel reference table
- GST calculation logic
- Printer implementation
- Backup/restore implementation
- Electron security model
- Known risks and mitigations

---

## Roadmap

- [ ] KDS (Kitchen Display Screen) on a second monitor
- [ ] Multi-terminal LAN sync
- [ ] WhatsApp bill delivery
- [ ] Customer loyalty / membership
- [ ] Cloud backup to Google Drive
- [ ] UPI QR code on bill receipt

---

## License

MIT — see [LICENSE](./LICENSE) for details.
