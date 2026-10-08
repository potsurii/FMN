-- Phase 3 Batch 2C-1 — L-01 Destination
-- Add nullable free-text destination on trips.
-- No NOT NULL. No historical backfill.

alter table public.trips
  add column destination text;
