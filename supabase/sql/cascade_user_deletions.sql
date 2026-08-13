-- ============================================================================
-- User deletion cascades
-- Deleting auth.users already cascades to public.users (setup.sql). This patch
-- makes the tables that reference public.users cascade as well, so that a full
-- user deletion (e.g. auth.admin.deleteUser) removes all of their data without
-- FK violations. Chained cascade — no direct reference to auth schema needed.
-- Safe to re-run (drops and re-adds the same constraints).
-- ============================================================================

BEGIN;

ALTER TABLE public.event_registrations
    DROP CONSTRAINT IF EXISTS event_registrations_user_id_fkey;
ALTER TABLE public.event_registrations
    ADD CONSTRAINT event_registrations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.membership_payments
    DROP CONSTRAINT IF EXISTS membership_payments_user_id_fkey;
ALTER TABLE public.membership_payments
    ADD CONSTRAINT membership_payments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

COMMIT;
