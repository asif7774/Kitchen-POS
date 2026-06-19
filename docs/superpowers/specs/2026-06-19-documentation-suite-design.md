# Documentation Suite — Design Spec
**Date:** 2026-06-19  
**Project:** Kitchen POS  
**Status:** Approved

---

## Goal

Generate a complete documentation suite for the Kitchen POS project covering two distinct audiences: business stakeholders (restaurant owners, managers, investors) and technical contributors (developers).

---

## Audiences

| Audience | Needs | Language |
|---|---|---|
| Business stakeholders | Understand what the product does, how to use it, what's coming | Plain language, no jargon |
| Developers | Understand how the system works technically, IPC, DB, flows | Technical, precise |

---

## Document Structure

### `docs/business/` — Stakeholder-facing

| File | Purpose |
|---|---|
| `product-overview.md` | What the system is, who it's for, key benefits, platform requirements |
| `features.md` | Every feature in plain language — no technical jargon |
| `user-stories.md` | Role-based user stories (owner, manager, cashier, waiter) with acceptance criteria |
| `release-notes-v1.md` | What's live and working in v1.0 |
| `roadmap.md` | Planned features with priority order |

### `docs/technical/` — Developer-facing

| File | Purpose |
|---|---|
| `functional-spec.md` | End-to-end functional spec per module — inputs, outputs, rules, edge cases |
| `system-flows.md` | Order lifecycle, KOT flow, billing flow, printer triggers — with ASCII flow diagrams |
| `ipc-api-reference.md` | Every IPC channel — payload shape, response shape, error states |
| `data-model.md` | Full DB schema with field descriptions, relationships, constraints, design decisions |
| `module-guide.md` | Per-module architecture — files, responsibilities, key components |

### Rendered Output

| Artifact | Contents |
|---|---|
| Business HTML artifact | All 5 business docs combined, styled for sharing with stakeholders |
| Technical HTML artifact | All 5 technical docs combined, styled for developer reference |

---

## Scope

### Modules covered (15 total)
Dashboard, Order, Tables, Menu, KDS, Inventory, Customers, Staff, Expenses, Reports, PastOrders, Login, Settings, Backup, Billing

### What's included
- All features currently in the codebase
- GST compliance rules and invoice format
- Printer flow (KOT + bill)
- Database schema as-is
- IPC channels from `ARCHITECTURE.md` + actual backend IPC files
- Roadmap from README.md

### What's excluded
- Code comments or inline documentation
- Test documentation
- Deployment / CI pipeline docs

---

## Format Decisions

- Markdown files committed to `docs/business/` and `docs/technical/`
- Tables used for structured data (IPC reference, schema, features)
- ASCII flow diagrams for system flows (no external tooling required)
- HTML artifacts generated for both audiences after all Markdown is written
- No duplication between the two sets — cross-references used where needed

---

## Source of Truth

All content derived from:
1. `README.md` — features, setup, GST notes, keyboard shortcuts
2. `ARCHITECTURE.md` — schema, IPC table, security model, flows
3. `backend/src/ipc/` — actual IPC handlers (ground truth over ARCHITECTURE.md where they differ)
4. `frontend/src/pages/` — module list and UI behaviour
5. Git log — release state and what's built vs planned
