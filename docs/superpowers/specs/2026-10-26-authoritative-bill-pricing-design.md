# Authoritative Bill Pricing — Design

> Status: proposed · 2026-10-26 · branch base: `refactor/settings-page` (v1.1.0)

## Intent

The bill total shown on screen, the total printed on the customer's receipt, and the
total stored in the `bills` table are computed by two separate implementations and
currently **disagree with each other**. Staff collect one amount and hand the customer
a receipt for a different one, and the CGST/SGST figures filed for GST are computed
from a base the customer never paid.

This work makes the Electron main process the single authority for every number on a
bill. The renderer stops doing tax arithmetic entirely and instead asks the main
process what the bill comes to.

## Why now

This is not a hypothetical drift. It is reproducible on the current build.

### The defects

**1. The frontend hardcodes the GST rate.**

`frontend/src/pages/Order/components/BillModal.tsx:20`

```ts
const GST_RATE = 0.025; // 2.5% CGST + 2.5% SGST = 5% total GST
```

The backend (`backend/src/services/gst.ts`) reads `cgst_rate` and `sgst_rate`
**per order item** from the database. Menu items can be configured with other rates
(18% — 9+9 — is standard for AC and liquor-serving establishments in India). Any item
not at exactly 2.5/2.5 is charged at a rate different from the one displayed.

**2. Discount is applied at a different point in each sequence.**

| | Order of operations |
|---|---|
| Frontend (`BillModal.tsx:49-52`) | `subtotal − discount` → then compute tax on the discounted base |
| Backend (`billing.ts:32-35`) | compute tax on the full base → then subtract discount from the total |

**3. Screen, receipt, and database disagree.**

The payment-balance check (`BillModal.tsx:61`) validates against the **frontend's**
`finalTotal`. The printed receipt (`BillModal.tsx:89`, `printer.ts:178-185`) renders
from `res.data` — the **backend's** returned totals.

### Worked example

A ₹1000 order, ₹100 bill-level discount, GST enabled, all items at 2.5/2.5:

| | Screen | Receipt | `bills` row |
|---|---|---|---|
| Taxable | ₹1000.00 | ₹1000.00 | ₹1000.00 |
| CGST | ₹22.50 | ₹25.00 | ₹25.00 |
| SGST | ₹22.50 | ₹25.00 | ₹25.00 |
| Discount | ₹100.00 | ₹100.00 | ₹100.00 |
| **Grand total** | **₹945.00** | **₹950.00** | **₹950.00** |

Cash drawer receives ₹945. Receipt says ₹950. GST is filed on ₹25.00/₹25.00 of tax
against a sale the customer paid ₹945 for.

## Goals

1. Exactly one implementation of bill arithmetic, in the Electron main process.
2. The screen, the printed receipt, and the `bills` row always show identical figures.
3. The amount staff are asked to collect is the amount on the receipt.
4. Discount semantics are defined once, explicitly, and documented.

## Non-goals

- Changing *which* discount semantics are correct beyond picking one and applying it
  consistently. (See "Decisions" — pre-tax is chosen, with reasoning.)
- Per-item discounts. The `OrderItem.discount` field exists and `calcLineItemTax`
  honours it, but no UI sets it. Leave it working; do not build UI for it here.
- Modifier groups, loyalty, gift cards, or any other roadmap feature. This change is
  correctness only.
- Idempotency keys on checkout. **Already handled** — `createBill` guards
  `status === 'billed'` inside the `db.transaction`, and better-sqlite3 runs
  synchronously in the main process, so two IPC calls cannot interleave mid-transaction.
- Migrating existing incorrect `bills` rows. Out of scope; see "Open question for the
  user" below.

## Anti-goals

Things that would make this a failure even if the totals match:

- **Adding a round trip per keystroke.** The discount field must stay responsive. A
  preview call on every character typed would make billing feel broken even while
  being arithmetically correct.
- **Leaving a second copy of the math behind "just for display."** If any tax
  arithmetic remains in the renderer after this change, the bug can return silently.
- **Making the preview and the commit two different functions.** They must share one
  code path, or they will drift again the first time either is edited.

## Constraints

- Electron + SQLite, single main process, IPC via `contextBridge`
  (`window.api.invoke('module:action', payload)`).
- Existing channel naming convention is `module:action`.
- `calcBillTotals` / `calcLineItemTax` in `backend/src/services/gst.ts` are already
  correct and already read per-item rates. They are the keeper implementation.
- `is_gst_enabled` lives in `electron-store`, read by the main process. The renderer
  currently fetches it separately via `api.settings.get()` — it should no longer need to
  for billing purposes.
- Project standards apply: no `any`, no `eslint-disable`, Tailwind-first, lint and
  build must pass before the work is considered done.

## Decisions

These are settled; the builder should implement them as written.

### D1 — Add a `billing:preview` IPC channel

A new channel that runs the same arithmetic as `createBill` but commits nothing.

```ts
// Request
{ orderId: number; discount: number }

// Response
{
  // bill-level
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  discount_amount: number;
  total_amount: number;

  // per-line, so the renderer can show the itemised breakdown
  // without computing anything itself (see D4)
  lines: Array<{
    order_item_id: number;
    taxable_amount: number;   // after this line's share of the discount
    cgst_amount: number;
    sgst_amount: number;
    total_amount: number;
  }>;
}
```

The `lines` array exists because `BillModal` renders a per-item tax breakdown. Without
it, D4 would force that breakdown to be deleted or to keep its own arithmetic — both
unacceptable. The preview carries every number the modal displays.

### D2 — Extract one shared calculation function

`createBill` and `previewBill` must both call a single pure function. Extract the
arithmetic currently inline in `billing.ts:30-35` into something like:

```ts
// backend/src/services/billing.ts
export function computeBillTotals(items: OrderItem[], discount: number, isGstEnabled: boolean)
```

`createBill` calls it and then writes rows. `previewBill` calls it and returns.
Neither re-implements any part of it. This is the core of the change — if the two
paths share one function, the classes of bug above cannot recur.

### D3 — Discount is applied **pre-tax**

The two sides disagree today, so one must be chosen. Choose the **frontend's** current
order: discount reduces the taxable base, then tax is computed on the reduced base.

Reasoning: under Indian GST, tax is charged on the actual transaction value. A discount
given at the point of sale and shown on the invoice reduces that value, so GST is due on
the discounted amount. Computing tax on the pre-discount base (what the backend does
today) over-reports output tax.

This means **`billing.ts:34-35` is the side that changes.** The backend currently does:

```ts
totals.discount_amount += discount;
totals.total_amount = Math.round((totals.total_amount - discount) * 100) / 100;
```

That is the incorrect sequence and must be replaced by applying the discount before
`calcBillTotals` computes tax.

> The builder should flag it if the project has a tax advisor or an existing written
> position that contradicts this. The *consistency* requirement is non-negotiable; the
> specific choice of pre-tax is a reasoned default that a tax professional could
> override.

#### D3a — Allocating the discount across lines with different tax rates

`calcBillTotals` taxes each line at that line's own `cgst_rate`/`sgst_rate`. A bill can
therefore mix rates (5% food alongside 18% liquor), and "reduce the taxable base" is
undefined until the allocation rule is stated. It is:

**Allocate the bill-level discount pro-rata by line value.**

```
lineShare[i] = discount × (lineValue[i] / Σ lineValue)
```

where `lineValue[i] = unit_price × qty`. Each line's share is subtracted from its base
before that line's rate is applied.

Reasoning: a discount on the whole bill reduces every supply in it proportionally, so
each tax rate's base shrinks by the same percentage. The alternatives — consuming the
discount against lines in some arbitrary order, or applying one blended rate — both
produce a CGST/SGST split that does not correspond to the goods actually sold, and that
split is what gets filed.

**Rounding.** Compute the allocation on unrounded values, round each line to 2dp, then
assign any residual paise from `discount − Σ roundedShare` to the single largest line
by value. This keeps `Σ lineShare` exactly equal to the entered discount, so the
bill-level `discount_amount` always reconciles against the per-line figures. Ties on
"largest line" break by lowest `order_item_id` for determinism.

### D4 — The renderer does no tax arithmetic

Delete `GST_RATE`, `cgstTotal`, `sgstTotal`, `totalAfterDiscount`, and `finalTotal`
from `BillModal.tsx`. The component holds the previewed totals in state and renders
them. `taxableTotal` as a pre-preview cart subtotal may stay **only** if it is purely
a cart-line display and never feeds a tax or grand-total figure.

The payment-balance check (`isBalanced`) must validate against the **previewed**
`total_amount`, never a locally computed one.

### D5 — Debounce the preview on discount changes

The preview is called:
- when the modal opens,
- when the cart changes,
- when the discount changes, **debounced ~250–300ms.**

Until the first preview returns, the confirm button is disabled. Never let the user
confirm against a stale or absent preview.

### D6 — Guard against committing a stale preview

`createBill` already recomputes authoritatively, so the committed figures are always
correct. The risk is the *user* confirming while looking at superseded numbers. The
builder should ensure a preview request in flight (or a changed discount since the
last preview) blocks confirmation.

### D7 — Discount bounds are enforced in the main process

The renderer currently clamps with `Math.max(0, …)`; the main process does not. Once the
main process is authoritative, both cases become reachable there.

- **Negative discount** → reject. `previewBill` and `createBill` both throw. A negative
  discount is invalid input, not something to silently coerce.
- **Discount greater than the subtotal** → clamp to the subtotal, producing a zero
  total. A full comp is a legitimate operation, and the existing `complimentary`
  payment method implies it is already in use.

`previewBill` can therefore fail, which is what D5/D6's disabled-confirm state must
handle.

### D8 — Preview and commit read the same item set

`previewBill` reads `order_items` by `order_id` exactly as `createBill` does
(`billing.ts:30`). It must not accept items passed in from the renderer, and it must not
use a different query. If the two read differently, this change reintroduces the very
bug it exists to remove.

Note that `BillModal` currently derives its display cart from `sentKOTs.flatMap(k => k.items)`
rather than from `order_items`. After this change the modal renders the preview's `lines`,
so that divergence stops mattering for totals.

> **Separate defect to flag, not fix here:** the `order_items` query has no status
> filter. If the schema can mark an item cancelled or voided, such items are currently
> billed. The builder should check whether that column exists and, if so, raise it as its
> own issue — changing the filter would alter billed totals for existing flows and is out
> of scope for a change whose whole purpose is that totals stop changing unexpectedly.

### D9 — Do not overwrite a payment split the user has edited

`BillModal` currently resets the entire `payments` array in a `useEffect` keyed on the
total. With an async debounced preview, that will wipe a part-entered split payment
mid-keystroke.

Auto-populate a single cash row at the previewed total **only while the payment rows are
untouched**. Once the user has edited any payment row, a new preview must not rewrite
them — instead leave them as entered and let the existing `isBalanced` check surface the
mismatch, with confirmation blocked until it reconciles.

## What is left to the builder

- Where the previewed totals live in `BillModal`'s state, and the exact debounce
  mechanism (a hook, `setTimeout`, or an existing project utility — follow what the
  codebase already does).
- Whether `previewBill` lives in `services/billing.ts` beside `createBill` or in its
  own module.
- Loading and error presentation while a preview is in flight — follow existing
  modal/toast conventions.
- Whether `is_gst_enabled` can be dropped from `BillModal`'s own fetch once the
  preview carries the GST-applied figures.
- Test coverage. At minimum, a unit test on `computeBillTotals` asserting the worked
  example above, and a test that a non-2.5% item rate flows through correctly.

## Open question for the user

**Existing `bills` rows written before this fix contain the wrong CGST/SGST split.**
Deciding what to do about them — leave them, annotate them, or correct them — has GST
filing implications and is not a call to make inside this change. Flag it; do not act
on it here.

## Verification

The change is done when:

1. `computeBillTotals` has unit tests **in the backend workspace** covering: the worked
   example above, a non-default tax rate, a mixed-rate bill where pro-rata allocation
   and the residual-paise rule are both exercised, a discount exceeding the subtotal,
   and a rejected negative discount. The backend has `vitest` configured but no test
   directory yet — create one.
2. Billing an order with a discount produces identical figures on screen, on the
   printed receipt, and in the `bills` row.
3. An order containing an item at a non-2.5% rate bills correctly.
4. `grep -rn "GST_RATE\|0\.025" frontend/src` returns nothing.
5. `npm run lint`, `npm run tsc`, `npm run test` in `frontend/`, the backend test
   suite, and a root `npm run build` all pass.
