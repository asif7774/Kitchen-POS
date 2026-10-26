# Contributing to Kitchen POS

Thank you for your interest in contributing. This document covers how to report bugs, request features, and submit code changes.

## Getting Help or Requesting a Feature

For direct assistance or to propose a new feature:

**Email:** [asif.ansari7774@gmail.com](mailto:asif.ansari7774@gmail.com)

Please include:
- A clear description of what you need
- Your use case (what restaurant type, workflow, or problem you're solving)
- Any relevant screenshots or examples

For bugs and feature requests that should be tracked publicly, open a [GitHub Issue](../../issues).

---

## Development Setup

```bash
git clone https://github.com/your-org/kitchen-pos.git
cd kitchen-pos
npm install
npm run dev
```

See [README.md](./README.md#quick-start) for full setup instructions.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Stable, released code |
| `feature/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `refactor/<name>` | Refactors with no behaviour change |

Always branch from `master`. Open PRs against `master`.

---

## Before Opening a Pull Request

Run in order and fix all failures:

```bash
cd frontend && npm run lint    # zero ESLint errors
cd frontend && npm run build   # zero TypeScript errors
cd frontend && npm run test    # all Vitest tests pass
npm run build                  # full app build succeeds
```

**We do not accept PRs with:**
- ESLint disable comments (`eslint-disable`, `eslint-disable-next-line`)
- TypeScript `any` type or `@ts-ignore`
- Broken builds or failing tests

---

## Code Standards

### TypeScript
- No `any`. Use explicit interfaces, `unknown`, or discriminated unions.
- No `@ts-ignore` or `@ts-expect-error`. Fix the underlying type issue.

### React
- No ref mutation during render — use `useCallback` or `useEffect`.
- No `setState` inside `useEffect` when the value can be derived during render.
- Files exporting React components must not also export hooks or utilities — split them.

### UI & Styling
- **Tailwind CSS first.** No inline `style={{...}}` unless the value is dynamically calculated at runtime.
- Reuse existing shared components (`Button`, `Modal`, `Tooltip`, etc.) — never duplicate with raw HTML.

### IPC Channels
- Follow the `module:action` convention: `orders:create`, `menu:list`, `billing:generate`.
- Always validate inputs in the main process handler, not only in the renderer.

### Commit Messages
- Write from the perspective of a human developer describing the technical change.
- No AI agent names, no `Co-authored-by` lines attributing work to an AI assistant.
- Use the imperative mood: "add table status polling" not "added" or "adds".

---

## Reporting a Bug

Open a GitHub Issue with:

1. **Steps to reproduce** — numbered, exact
2. **Expected behaviour**
3. **Actual behaviour**
4. **Environment** — OS, app version (shown in Settings → About), Node version
5. **Screenshot or screen recording** if relevant

---

## Feature Request Guidelines

A good feature request includes:

- The **user story**: "As a [role], I want [capability] so that [outcome]."
- Why the current behaviour falls short
- Whether you're willing to implement it yourself (great if yes, not required)

High-priority features from the current roadmap:
- Menu modifier groups (add-ons, variants)
- Reservations flow
- Granular per-permission RBAC
- Real-time KDS push across windows

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
