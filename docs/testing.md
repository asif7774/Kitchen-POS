# Testing Guide — Kitchen POS

This document covers the test structure, how to run tests, how to write new ones, and the E2E testing approach.

---

## Test Stack

| Layer | Tool | Scope |
|-------|------|-------|
| Unit / integration | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | Frontend components, hooks, utilities |
| E2E (smoke) | [Playwright](https://playwright.dev/) | Full app launch → screenshot every page |
| E2E (full, planned) | Playwright + Chromium | Login → order flow → billing → KDS |

---

## Running Unit Tests

```bash
cd frontend

# Run once (CI mode)
npm run test

# Watch mode (development)
npm run test:watch      # or: npx vitest

# With browser UI
npm run test:ui

# With coverage report
npx vitest run --coverage
```

Test output lands in the terminal. Coverage report is written to `frontend/coverage/`.

---

## Test File Conventions

- Test files live **next to the code they test**, not in a separate `__tests__/` folder.
- Naming: `MyComponent.test.tsx`, `useMyHook.test.ts`, `myUtil.test.ts`
- Use `describe` to group related cases; use `it` (not `test`) for individual assertions.

```
frontend/src/
├── contexts/
│   ├── AuthContext.tsx
│   └── AuthContext.test.tsx       ← tests for AuthContext
├── utils/
│   ├── svgSpriteUtils.ts
│   └── svgSpriteUtils.test.ts     ← tests for SVG sprite utilities
└── components/
    └── atoms/
        └── Button/
            ├── Button.tsx
            └── Button.test.tsx    ← add component tests here
```

---

## Writing a Unit Test

### Component test

```typescript
// frontend/src/components/atoms/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders the label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Hook test

```typescript
// frontend/src/hooks/useTableStatus.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTableStatus } from './useTableStatus';

describe('useTableStatus', () => {
  it('returns available for an empty table', () => {
    const { result } = renderHook(() => useTableStatus({ orderId: null }));
    expect(result.current.status).toBe('available');
  });

  it('returns occupied when an order is active', () => {
    const { result } = renderHook(() => useTableStatus({ orderId: 42 }));
    expect(result.current.status).toBe('occupied');
  });
});
```

### Mocking the IPC layer

The frontend calls the Electron backend through `window.api.invoke`. In tests, mock it on `window`:

```typescript
// In your test file or a setup file
import { vi, beforeEach } from 'vitest';

beforeEach(() => {
  window.api = {
    invoke: vi.fn().mockResolvedValue({ success: true, data: [] }),
  } as unknown as typeof window.api;
});
```

For specific return values:

```typescript
vi.mocked(window.api.invoke).mockResolvedValueOnce({
  success: true,
  data: [{ id: 1, name: 'Table 1', status: 'available', capacity: 4 }],
});
```

---

## IPC Handler Tests (Backend)

Backend IPC handlers in `backend/src/ipc/` can be unit-tested by importing the handler functions directly with a mocked database:

```typescript
// backend/src/ipc/orders.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrder } from './orders';

const mockDb = {
  prepare: vi.fn().mockReturnValue({ run: vi.fn(), get: vi.fn(), all: vi.fn() }),
};

describe('createOrder', () => {
  it('inserts a new order and returns the id', () => {
    mockDb.prepare().run.mockReturnValue({ lastInsertRowid: 7 });
    const result = createOrder(mockDb as never, { tableId: 1, items: [] });
    expect(result.id).toBe(7);
  });
});
```

---

## E2E Smoke Test (Playwright)

A smoke-test script ships at the root of the repo. It starts the frontend dev server, logs in, opens a shift, navigates every page, and saves a screenshot of each.

### Prerequisites

```bash
npm install                    # installs playwright-core
npx playwright install chromium   # downloads the browser (one-time)
npm run dev &                  # start the dev server
```

### Run

```bash
node screenshot-tool.mjs
```

Screenshots are written to `docs/assets/screenshots/`. A failed screenshot (blank frame, error overlay) means a regression on that page.

---

## Planned E2E Test Suite

The following flows are prioritised for full Playwright e2e coverage:

### Priority 1 — Core POS flow

```
Login (PIN) → Open Shift → Open Table → Add Items → Send KOT →
View KDS → Bump Ticket → Generate Bill → Collect Payment → Close Table
```

### Priority 2 — Menu management

```
Login (admin) → Menu → Add Category → Add Item with tax config →
Toggle availability → Verify item appears in Order screen
```

### Priority 3 — Shift & reports

```
Login → Open Shift → Create 3 orders → Close Shift →
Open Reports → Verify daily total matches order sum
```

### Priority 4 — Backup & restore

```
Login (admin) → Settings → Export Backup → verify .sqlite file exists
→ Factory Reset → Import Backup → verify data restored
```

### Running Planned Tests (once written)

```bash
cd frontend
npx playwright test            # all e2e tests
npx playwright test --ui       # interactive mode
npx playwright test --headed   # visible browser
```

Test files will live in `frontend/e2e/`.

---

## CI

A GitHub Actions pipeline is on the roadmap. Planned workflow:

```yaml
# .github/workflows/ci.yml (planned)
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm install
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run tsc
      - run: cd frontend && npm run test
      - run: npm run build
```

---

## What We Don't Test

- **Electron window management** — not worth the xvfb complexity; covered by the smoke-test screenshots instead.
- **ESC/POS printing** — requires physical USB hardware; verified manually.
- **SQLite migrations** — tested implicitly by the full build + smoke-test; migration files are immutable once committed.
