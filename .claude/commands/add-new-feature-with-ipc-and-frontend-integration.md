---
name: add-new-feature-with-ipc-and-frontend-integration
description: Workflow command scaffold for add-new-feature-with-ipc-and-frontend-integration in Kitchen-POS.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-feature-with-ipc-and-frontend-integration

Use this workflow when working on **add-new-feature-with-ipc-and-frontend-integration** in `Kitchen-POS`.

## Goal

Implements a new backend feature with IPC handlers, updates preload bindings, defines new types, and wires up corresponding frontend context/hooks/components and UI.

## Common Files

- `backend/src/ipc/*.ts`
- `backend/src/preload.ts`
- `backend/src/main.ts`
- `frontend/src/types/models.ts`
- `frontend/src/lib/ipc.ts`
- `frontend/src/contexts/*.tsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create backend IPC handler file (backend/src/ipc/feature-name.ts)
- Update preload bindings (backend/src/preload.ts)
- Update main entry if needed (backend/src/main.ts)
- Define new types/interfaces (frontend/src/types/models.ts)
- Add IPC bindings to frontend (frontend/src/lib/ipc.ts)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.