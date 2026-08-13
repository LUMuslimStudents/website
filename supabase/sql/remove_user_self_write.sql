-- ============================================================================
-- Fix: remove all self-write access to public.users for regular users.
--
-- Rationale: there is no user-settings page or self-update pathway — the
-- users row is created server-side by handle_new_user, and only admins (or
-- dashboard sessions) may modify it. Keeping `users_insert_own` and
-- `users_update_own` only widened the attack surface (e.g. arbitrary
-- self-column updates).
--
-- The prevent_role_escalation / prevent_role_insert_escalation triggers
-- remain as defense in depth.
--
-- Run with: npx supabase db query --linked -f supabase/sql/remove_user_self_write.sql
-- ============================================================================

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
