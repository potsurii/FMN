-- Phase 3 — Shopping Todo Legacy/New boundary (D2-06)
-- Runtime classification uses the TypeScript constant in
-- lib/todos/legacy-boundary.ts (FMN_LEGACY_TODO_BOUNDARY_UTC).
-- This migration records the Product Owner decision only.
-- Does NOT rewrite todo rows, add NOT NULL, or change RLS.
--
-- shopping_todos table comment was NULL before this migration
-- (verified via obj_description); safe to set without overwrite merge.

comment on table public.shopping_todos is
  'Phase 3 Legacy/New boundary UTC: 2026-10-02T00:00:00.000Z';
