---
name: add-database-table-and-migrate-schema
description: Workflow command scaffold for add-database-table-and-migrate-schema in Kitchen-POS.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-database-table-and-migrate-schema

Use this workflow when working on **add-database-table-and-migrate-schema** in `Kitchen-POS`.

## Goal

Adds a new database table or column, creates migration SQL, and updates backend logic to use new schema.

## Common Files

- `backend/src/db/migrations/*.sql`
- `backend/src/ipc/*.ts`
- `backend/src/services/*.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create migration SQL file (backend/src/db/migrations/NNN_feature.sql)
- Update backend logic to use new table/column (backend/src/ipc/*.ts, backend/src/services/*.ts)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.