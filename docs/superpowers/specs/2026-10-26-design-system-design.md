# Design System — Design

> Status: proposed · 2026-10-26 · branch base: `master`

## Intent

Introduce a token-driven design system for the Kitchen POS frontend: a defined
palette, type scale, spacing and radius scale, and a set of component primitives that
every page is built from. Then migrate the existing pages onto it.

## Why now

A survey of `frontend/src` found that **there is no design system to replace.** What
exists is unstyled-by-default Tailwind plus leftover CSS from the marketing template the
project was scaffolded from. Three findings set the shape of this work.

### 1. The token layer is a single line

`src/index.css` contains exactly one token:

```css
@theme {
  --background-image-brand-gradient: linear-gradient(134.82deg, #10b981 23.64%, #eab308 85.47%);
}
```

No color, spacing, radius, or type tokens. No `--color-*` custom properties. The
`tailwind.config.js` is an empty comment stub. Every colour decision in the app is a
Tailwind utility class chosen per-component.

### 2. The remaining CSS is cruft from a dark-background marketing starter

`@layer components` in `index.css` is largely dead template styling, now sitting in a
light-background POS:

| Rule | Declares | Problem |
|---|---|---|
| `.heading-primary` | `text-purple-400` | Purple. The brand is green/gold. |
| `.heading-secondary` | `text-purple-200` | Same. |
| `.card` | `bg-white/5` | 5% white — designed for a dark page. |
| `.card-body` | `text-black` | Black text on a 5%-white card. |
| `.card-link` | `text-white` | Invisible on the light background. |
| `.text-body` | `text-gray-300` | Fails contrast on white. |

The brand gradient is additionally hand-redefined **three times at two different
angles** — `134.82deg` in `@theme`, `160.82deg` in the utility layer.

There is also a global `html { font-size: 13px }` — a scale-down hack that every
`rem`-based size in the app silently inherits from.

### 3. There is no typography at all

**No `font-family` is declared anywhere**, and `index.html` loads no font. The entire
application renders in Tailwind's default `system-ui` stack. There is no typographic
identity to migrate — only one to introduce.

### The encouraging part

The codebase is cleaner than the above suggests:

- **Arbitrary Tailwind hex (`bg-[#…]`): zero.** Nobody has been bypassing the utility
  system. Migration is therefore mostly *additive* — define tokens, then swap utility
  classes for token-backed ones — rather than an excavation.
- The **SVG sprite system is sound** and stays as-is: 91 icons in `frontend/icons/` →
  `scripts/generate-svg-sprite.js` → `public/sprite.svg`, loaded once via
  `<SvgSpriteLoader />`, consumed as `<SvgIcon name="…" />`.
- `pages/Components.tsx` already exists as a component gallery — a ready-made visual
  proving ground for the token migration.

### Where consistency is drifting

| Axis | Current state |
|---|---|
| Radius | **10 distinct values.** `rounded-lg` ×48, `rounded-full` ×35, `rounded-md` ×33, `rounded-xl` ×17, `rounded-2xl` ×8, plus `none/sm/b/t/3xl`. Three competing "defaults". |
| Type | No scale. `text-sm` ×150, `text-xs` ×52, `text-lg` ×26, `text-2xl` ×26, `text-xl` ×15, `text-base` ×7. |
| Buttons | **17 raw `<button>` elements in pages** vs 13 files importing the shared one. Worst: `Login/PinPad.tsx` (4), then `TableStatusCard`, `SecurityCard`, `CartPanel`, `Dashboard` (2 each). |
| Status colours | Inlined per component. `TableStatusCard.tsx:54-62` hardcodes the available/occupied/bill-requested palette locally. |
| Raw hex in TSX | 33 across 4 files — chart palettes in `KPICard`, `Dashboard`, `Reports` (`#8b5cf6`, `#3b82f6`, `#06b6d4`, `#f97316`); `#6b7280` appears 10×. |
| Card concepts | Three: `atoms/card`, `molecules/KPICard`, `organisms/feature-card`. |

### Scale of the migration

| | Files | Lines |
|---|---|---|
| `src/pages/` | 46 | 8,354 |
| `src/components/` | 32 | 3,975 |
| **Total** | **90** | **13,192** |

Largest: `Dashboard` 604, `Components.tsx` 603, `Reports` 419, `Menu` 377, `Order` 351.

## Goals

1. One token layer that every colour, size, radius, and type decision derives from.
2. A working dark mode. The app currently has none.
3. Status colour (available / occupied / bill-requested / KDS ticket age) expressed as
   **semantic** tokens, defined once, so operational signals are consistent everywhere.
4. Shared primitives actually used — no raw `<button>` left in pages.
5. The template cruft removed from `index.css`.
6. A real typographic identity, chosen for POS conditions.

## Non-goals

- **Changing the domain model or the operations available.** The set of things staff can
  do — open a table, add items, send a KOT, bill, void — does not change. Screens may be
  rearranged; the work they support may not.
- Rewriting the SVG sprite system. It works; leave it.
- Adding a component library dependency. The primitives are owned in-repo.
- Touching backend or IPC code.
- The billing pricing work, which is specified separately and lands on its own branch.

## Anti-goals

Things that would make this a failure even if every page looks new:

- **Two systems coexisting indefinitely.** A half-migrated app with token-based and
  legacy components side by side is worse than either. The migration order below exists
  to prevent this, and `Components.tsx` is the check.
- **Tokens that encode where a thing is used rather than what it means.**
  `--color-table-card-border` is a dead end; `--color-status-available` survives
  redesigns.
- **Losing touch-target discipline.** This runs on POS terminals. `ARCHITECTURE.md:481`
  mandates tap targets ≥ 44px. See D9 — the code does not currently honour this, and the
  gap must be closed deliberately rather than papered over.
- **A dark mode that is a tinted inversion.** Dim-service legibility is the point; it
  needs its own contrast decisions, not `invert()`.

## Constraints

- **Tailwind 4, CSS-first config.** Tokens go in `@theme` in `src/index.css`. There is
  no v5 to upgrade to — 4.3.1 → 4.3.3 is a patch — so the config format is stable.
- React 19, Vite 8. Both current; no framework migration is in play.
- Atomic Design structure (`atoms/` → `molecules/` → `organisms/`) is the existing
  convention and stays.
- Project standards: no `any`, no `eslint-disable`, Tailwind-first (no inline `style`
  except for genuinely computed values), reuse shared components.
- Files exporting React components must not also export hooks — split if needed.

## Decisions

### D1 — A new visual identity

**Decided by the user: a completely new design, not a systematisation of the current
one.** The existing green → gold gradient, the dark navy sidebar, and the current card
language are all replaced.

This changes the character of the work. D7 steps 4–5 are **redesign**, not mechanical
class swaps — each page's visual language is reconsidered as it is migrated.

**Layout and screen structure are also in scope** (user, 2026-10-26: *"you may need to
completely re-design the application"*). Where a screen's arrangement genuinely fights
the work, rearrange it.

> **One caution, to apply judgement against rather than to override the latitude above.**
> Staff use this every shift and have muscle memory for where things are. Moving the bill
> action, or changing how a table is opened, has a real cost measured in retraining and
> in mistakes made mid-service — and mistakes here are wrong bills. So: move something
> when there is a reason beyond novelty, and leave the high-frequency service path
> (table → add items → KOT → bill) recognisable even as it is restyled. Novel arrangements
> are cheapest on the surfaces staff touch least — Settings, Reports, Inventory — and
> most expensive on Tables and Order.

The new identity must be grounded in how this software is actually used, not in a
general-purpose dashboard aesthetic:

- **Long shifts, varied light.** Dim evening dining rooms and bright daytime counters,
  the same terminal. This is why dark mode is a requirement rather than a nicety (D3).
- **Numbers are the primary content.** Prices, totals, covers, ticket ages. The
  typography and the layout both serve figures first (D4).
- **Status is operational signalling**, read across a room in under a second — not
  decoration (D2).
- **Touch-first**, gloved or wet hands, at speed (D9).

**The logo and app icon are in scope.** The current mark's green/gold gradient is the
identity being replaced; leaving it in place while the surrounding palette changes would
produce a clash. The fork-and-knife mark itself may be retained and restyled.

> The specific palette, type pairing, and surface language are chosen separately as a
> visual direction and agreed before step 1 begins. They are not left to be discovered
> during implementation — see "Choosing the direction" below.

### D2 — Semantic tokens are separate from brand tokens

Two distinct groups, never mixed:

```
--color-brand-*          /* identity: logo, primary actions, active nav */
--color-status-available / -occupied / -billRequested / -void
--color-kds-fresh / -warning / -overdue
--color-success / -warning / -danger / -info
```

Status colour is **operational signalling**, not decoration — staff read table state and
ticket age at a glance across a room. It must not shift because the brand accent changed.
Note the current status palette (green/amber/red) is also the only colour channel for
that information; the new primitives should pair it with a second cue (shape, label, or
icon) so it survives colour-blindness and bad terminal screens.

### D3 — Dark mode is in scope, with its own contrast decisions

Restaurants run evening service in low light; a glaring white POS screen is a real
complaint. Implement via `@media (prefers-color-scheme: dark)` plus a `data-theme`
override so staff can pin it per terminal, with the choice persisted.

Every token gets its light value on bare `:root` and is redefined for dark — no colour
may be defined *only* inside a dark block.

### D4 — Introduce a typeface chosen for POS conditions

Since none exists, this is pure gain. The selection criteria, in priority order:

1. **Tabular numerals.** Prices and totals sit in columns. `font-variant-numeric:
   tabular-nums` must be applied wherever figures align — this is the single highest-value
   typographic decision in the app.
2. Legible at a glance at arm's length on a counter-mounted screen.
3. Holds up at `text-xs`/`text-sm`, which is where 200+ of the app's usages sit.
4. **Self-hosted — bundled as `woff2` in the app, never loaded from a CDN.**

A single family with a strong numeric set is preferable to a display/body pairing here —
this is an operational tool, not an editorial page.

> **The font must not be fetched from Google Fonts or any CDN at runtime.** This app's
> central promise is that it works with no internet connection; a terminal in a
> restaurant with the WAN cable out would silently fall back to `system-ui` and lose the
> tabular numerals that criterion 1 identifies as the highest-value decision here. Pick a
> face with a license permitting redistribution, vendor the `woff2` files into the repo,
> and declare them with `@font-face` + `font-display: swap` and a real `system-ui`
> fallback stack.

### D5 — Delete the root font-size hack and build a real scale

Remove `html { font-size: 13px }`. It silently rescales everything and makes the type
scale impossible to reason about. Replace with a defined scale on a consistent ratio.

The current distribution is bottom-heavy (`text-sm` ×150, `text-base` ×7), which suggests
the 13px hack was compensating for a scale that felt too large.

**Resolve this toward legibility, not pixel parity.** At 13px root, `text-sm` renders at
roughly 11.4px — and that is the app's dominant size, on a screen read at arm's length
across a counter, often by someone mid-service. Reproducing that exactly would bake a
workaround into the new scale permanently.

Measure the current rendered sizes first, then set a base that is *at least* current and
likely a step above for body text, accepting that some dense surfaces need reflow. Where
a layout genuinely cannot absorb the increase, that is a signal the layout is too dense
for a touch terminal — note it rather than shrinking the type back.

### D6 — Collapse radius to three steps

Ten values and three competing defaults. Settle on **three** — a small (inputs, chips), a
medium (cards, panels), and full (pills, avatars) — plus `rounded-none`. Everything else
maps onto those.

### D7 — Migration order, with `Components.tsx` as the gate

1. **Tokens + typography + cruft removal** in `index.css`. No component changes.
2. **`pages/Components.tsx`** — migrate the gallery first. It is the visual proving
   ground and the regression surface for every step after.
3. **Primitives** — `Button`, `Input`, `Select`, `Card`, `Modal`, `Table`. Absorb the
   three competing card concepts into one `Card` with variants.
4. **High-traffic pages, in order of operational importance:** Tables → Order → KDS →
   Login. These are what staff use every shift.
5. **Remaining pages:** Dashboard, Reports, Menu, Inventory, Customers, Staff, Expenses,
   Settings, Past Orders.
6. **Delete the dead weight:** `atoms/logos/vite.tsx`, `organisms/footer`,
   `organisms/feature-card` — starter leftovers with no place in a POS.

Each step lands green (lint, tsc, test, build) before the next begins.

### D8 — Raw `<button>` elimination is part of the primitive step

The 17 raw `<button>` elements are migrated when `Button` is built, not opportunistically
later. `Login/PinPad.tsx` (4 of them) is the one deliberate exception to evaluate — a PIN
keypad has genuine sizing and hit-area requirements that may warrant its own primitive
rather than being forced through the generic `Button`.

### D9 — The 44px tap target is a real standard the code currently violates

`ARCHITECTURE.md:481` states: *"All tap targets ≥ 44px — staff may use a touchscreen
terminal."* The shared `Button` ships `sm: min-h-[30px]` and `md`/`icon` at 42px, so
**every size fails the project's own rule.**

Resolve it as follows rather than with a blanket `min-h` that reflows every dense
surface:

- **Touch-critical controls** — anything a staff member taps during service (menu item
  tiles, cart steppers, KOT/bill actions, table cards, KDS bump, the PIN pad) **must**
  meet 44px. These are the rule's actual subject.
- **Dense administrative surfaces** (settings rows, report filters, table-row actions)
  may use a smaller visual target **provided the interactive hit area is padded to 44px**
  — a visually 32px icon button with invisible padding to 44px satisfies both.
- `Button`'s `sm` variant is re-specified so its hit area meets 44px even where its
  painted box is smaller.

Each touch-critical surface is checked against this when its page is migrated, not
retrofitted afterwards.

### D10 — Dark mode lands per step, and needs a main-process decision

There are **zero** `dark:` occurrences in the codebase today, so every one of the 90
files needs a dark pass. That pass happens **as part of each D7 step**, not as a sweep at
the end — a page is not "migrated" until it is correct in both themes. This is what the
"no two systems coexisting" anti-goal requires in practice.

In Electron, `prefers-color-scheme` follows `nativeTheme`, so a per-terminal theme pin is
not purely a CSS concern: it needs `nativeTheme.themeSource` set from the main process
and the preference persisted. Treat that as a small main-process task inside step 1, not
as an afterthought.

### D11 — Visual acceptance is screenshot comparison, not the test suite

"Lands green (lint, tsc, test, build)" proves nothing visual, and the repo has no
snapshot or visual-regression tooling.

Use a Playwright screenshot harness against the dev server — the approach is already
proven in this repo (it produced the README screenshots): log in, open a shift, visit
each route, capture at 1440px and at touch-terminal width, in both themes. Capture a
baseline set **before** step 1, then re-capture after each step and compare.

The comparison is a human looking at before/after pairs. Do not budget for building
pixel-diffing infrastructure; the gallery at `pages/Components.tsx` plus per-route
captures is enough to catch what matters at this scale.

### D12 — `DESIGN.md` and `ds-entry.ts` are in scope

Both are tracked in git and both are affected:

- **`DESIGN.md`** documents the *current* system (gradient at `134.82deg`, "heavy use of
  `rounded-xl`/`lg`", system font). It contradicts this spec the moment step 1 lands.
  Rewriting it is part of the work, not a follow-up — a stale design document is worse
  than none.
- **`ds-entry.ts`** re-exports the primitives (`Button`, `Input`, `Toggle`, `Select`,
  `Textarea`, `Stepper`, `Autosearch`, `Card`/`CardHeader`/`CardTitle`/`CardContent`,
  `tooltip`) from the repo root. It is a public surface: changing a primitive's props is
  a **breaking change** beyond `frontend/src`. Keep it in sync, and if a primitive's API
  changes, say so explicitly in the commit.

The empty `ds-bundle/` directories (`tokens/`, `guidelines/`, `components/`) are
untracked scaffolding. The builder should establish whether anything consumes that bundle
before assuming it is dead; if it is live, `tokens/` is the natural home for the exported
token set.

### D13 — "Generous" applies to chrome, not to content grids

The chosen direction's spacing is for **components and controls**: card padding, touch
targets, the gap between panels, form rows. It is **not** a licence to space out dense
content.

Specifically, the **menu grid on the Order screen must stay dense.** A real client menu
runs to 80+ items; a four-across grid of text tiles turns routine order-taking into
scrolling, during service, which is when scrolling costs the most. Target a **six-across
grid with a sticky category rail**, so the common case is one tap with no scroll.

This is not a retreat from D1's direction. Card padding of ~18px and a six-across grid
are independent decisions — a spacing scale is not a single number applied everywhere.
The density toggle mentioned in Resolved remains the answer for *floor-plan* density;
this is about the menu grid specifically, where the dense default is simply correct.

### D14 — Charts reserve axis gutter and use tabular figures

Two defects that are easy to ship and embarrassing in a financial tool:

- Reserve explicit gutter width for y-axis labels. A currency axis that clips its leading
  digit (`,500.00`) misreports the number.
- Chart labels, KPI tiles, transaction lists, and cart lines all use
  `font-variant-numeric: tabular-nums`. Currency that does not align on the decimal is
  harder to scan and reads as unfinished.

### D15 — One status vocabulary, shared across every surface

Table state, KDS column state, and dashboard breakdowns must use **the same words and the
same colours**. If a table is "Occupied" on the floor plan, nothing elsewhere calls that
state "Seated" or "In service", and its dot is the same token everywhere.

This is the cheapest available source of product coherence: a single semantic token set
(D2) referenced by three unrelated screens makes them feel like one system even before
any of them is individually polished.

### D16 — KDS: the action verb carries the state

Patterns to adopt on the Kitchen Display:

- **One primary action per ticket, and its verb changes with column** — `Accept` in New,
  `Mark ready` in Preparing. State is then carried by *language*, not only by card
  position, which survives a glance from across the kitchen.
- **Every ticket shows its age and its station.** Age needs an **escalation ramp** —
  neutral, then warning, then critical as it passes the thresholds. A timer rendered in
  flat grey at every age communicates nothing, which is the most common KDS mistake.
- Priority is a second, independent channel (a marker that also tints the card edge), not
  a recolour of the status channel.

### D17 — Checkout happens in place, not in a modal

Billing should replace the order rail **while the menu grid stays visible**, rather than
opening a modal over the screen. The operator keeps spatial context, and returning to add
a forgotten item is not a dismiss-and-reopen cycle.

Where a derived figure depends on an input — a split-between count, a discount — show the
derived result live beneath the control in plain words ("₹304.67 each"), at the point of
decision. Instructional copy belongs inline where the decision is made, not in a tooltip.

### D18 — Receipt and print CSS is out of scope

`Order` and `Settings/SystemCard` touch printed-receipt output, which is rendered for a
58/80mm thermal printer and has nothing to do with screen theming. Do not restyle it, and
do not let the new tokens leak into it. A receipt that changes appearance is a regression.

## What is left to the builder

- The specific typeface, judged against D4's criteria.
- Exact token names, scale ratios, and step counts.
- Whether `Card` variants are props or separate exports.
- How the dark-mode preference is persisted (the project already uses `electron-store`
  for settings; whether this belongs there or in `localStorage` is the builder's call).
- Whether the chart palettes in `Dashboard`/`Reports` become tokens or stay a dedicated
  categorical chart scale. Either is defensible; decide once and apply to both files.
- Where tap-target enforcement lives (a shared class, a primitive-level minimum, or both).

## Branch strategy

Land this as **incremental merges to `master`**, one per D7 step, each independently
releasable — not as a single long-lived branch.

The "no two systems coexisting" anti-goal is about the **end state**, not a prohibition
on landing incrementally. A 13,000-line branch held open for weeks guarantees painful
conflicts, and the separately-branched billing work touches
`frontend/src/pages/Order/components/BillModal.tsx`, which this migration also reaches in
D7 step 4. Sequencing the billing change *before* the Order page migration avoids that
collision entirely; if they must overlap, the billing branch takes precedence and this
migration rebases onto it.

## Choosing the direction

Because D1 is now a new identity, the visual direction is settled **before** step 1
rather than emerging from it. The direction is chosen by reviewing concrete alternatives
applied to a real screen — the Tables view and the Order view, which between them exercise
status colour, dense figures, cards, and primary actions.

A direction is agreed when it specifies:

- the full palette in both themes, including the semantic status set from D2,
- the type pairing and scale, with the tabular-numeral behaviour from D4,
- the surface language: radius, elevation, border treatment, density,
- how the logo/app icon is restyled.

Only then does step 1 translate it into tokens.

## Resolved

- **How much visual change:** a completely new design, with light and dark themes.
  Settled by the user, 2026-10-26. Reflected in D1.

- **Visual direction: "Service".** Chosen by the user, 2026-10-26, from three
  alternatives rendered on the Tables and Order screens. Its defining properties:

  | | |
  |---|---|
  | Neutrals | Warm — a brown-shifted grey, not a blue-shifted one. Light base `#F4F2EF`, surfaces white; dark base `#161413`, surfaces `#201D1B`. |
  | Accent | Deep petrol/teal — `#1B5E57` on light, lifted to `#5FBFAF` on dark for contrast. |
  | Density | Generous. Larger padding (≈18px base), more breathing room between elements. Fits fewer tables per screen than the alternatives, deliberately. |
  | Surfaces | Soft elevation via shadow rather than borders; radius ≈10px (cards) / 14px (containers). |
  | Type | Humanist sans, single family, with tabular numerals on all figures. |
  | Status | Soft filled chips — tinted background, saturated foreground — not solid blocks or bare rails. |

  The intent is calm under pressure on a long shift. The accepted trade-off is
  information density: fewer tables visible at once than a compact direction would give.
  If floor-plan density later proves a problem on large venues, the answer is a density
  toggle, **not** a retreat on the spacing scale.

  > These values are the agreed *direction*, not the final token set. Step 1 derives the
  > full scale (brand 50–900, the semantic status set from D2, spacing and radius steps)
  > from them.

- **Rebrand to "Restaurant POS" and the repository rename:** deferred to **after** the
  design migration. Sequencing rationale — the redesign changes the logo and every
  screen, so renaming first means recapturing all screenshots and reworking brand assets
  twice. The repo rename lands last of all, since it breaks existing clone URLs.
  Note existing drift to clean up at that point: root `package.json` already says
  `restaurant-pos` while `frontend/package.json` says `kitchen-pos`.

## Verification

1. `grep -rn "text-purple\|bg-white/5\|font-size: 13px" src/` returns nothing.
2. The brand gradient is defined exactly once.
2b. No font is requested over the network: `grep -rn "fonts.googleapis\|fonts.gstatic" frontend/` returns nothing, and the app renders with the intended face with networking disabled.
3. `grep -rn "<button" src/pages/` returns nothing (or only the justified PinPad case).
4. Distinct `rounded-*` values in use ≤ 4.
5. No colour is defined only inside a dark-mode block.
6. Every screen renders correctly in both themes at 1440px and at touch-terminal width,
   verified by before/after screenshot pairs per D11.
7. Touch-critical controls meet the 44px hit area required by `ARCHITECTURE.md:481`.
8. `DESIGN.md` describes the system as built, and `ds-entry.ts` exports resolve.
9. Printed receipt output is byte-identical to before the migration.
10. `npm run lint`, `npm run tsc`, `npm run test`, and a root `npm run build` all pass.
