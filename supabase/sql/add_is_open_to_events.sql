-- ============================================================================
-- Add is_open to public.events_info.
--
-- When is_open = false the event is still visible on the Events page, but it
-- renders as "coming soon": no deadline, no price, registration disabled.
-- Admins flip it from the event details view in the dashboard.
--
-- Safe to re-run (IF NOT EXISTS). Mirrors schema.postgres.prisma.
-- ============================================================================

ALTER TABLE public.events_info
    ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT true;
