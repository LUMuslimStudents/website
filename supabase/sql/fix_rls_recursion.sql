-- ============================================================================
-- Fix RLS recursion by replacing self-referencing subqueries with a
-- SECURITY DEFINER function that bypasses RLS.
--
-- Problem: Policies like `EXISTS (SELECT 1 FROM public.users WHERE ...)`
-- cause infinite recursion when evaluating RLS on the same table.
--
-- Solution: `is_admin()` runs with owner privileges (SECURITY DEFINER),
-- so its internal query bypasses RLS and avoids the recursion cycle.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- ── Helper function (bypasses RLS to avoid recursion) ──────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── public.users policies ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "admins_read_all_users" ON public.users;
CREATE POLICY "admins_read_all_users" ON public.users
    FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "admins_update_users" ON public.users;
CREATE POLICY "admins_update_users" ON public.users
    FOR UPDATE
    USING (public.is_admin());

-- ── public.events_info policies ────────────────────────────────────────────

DROP POLICY IF EXISTS "events_admin_read" ON public.events_info;
CREATE POLICY "events_admin_read" ON public.events_info
    FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "events_admin_write" ON public.events_info;
CREATE POLICY "events_admin_write" ON public.events_info
    FOR ALL
    USING (public.is_admin());

-- ── public.event_registrations policies ────────────────────────────────────

DROP POLICY IF EXISTS "registrations_admin_read" ON public.event_registrations;
CREATE POLICY "registrations_admin_read" ON public.event_registrations
    FOR SELECT
    USING (public.is_admin());

-- ── public.event_registration_profiles policies ────────────────────────────

DROP POLICY IF EXISTS "reg_profiles_admin_read" ON public.event_registration_profiles;
CREATE POLICY "reg_profiles_admin_read" ON public.event_registration_profiles
    FOR SELECT
    USING (public.is_admin());

-- ── public.event_form_fields policies ──────────────────────────────────────

DROP POLICY IF EXISTS "form_fields_admin_write" ON public.event_form_fields;
CREATE POLICY "form_fields_admin_write" ON public.event_form_fields
    FOR ALL
    USING (public.is_admin());

-- ── public.event_registration_field_answers policies ───────────────────────

DROP POLICY IF EXISTS "field_answers_admin_read" ON public.event_registration_field_answers;
CREATE POLICY "field_answers_admin_read" ON public.event_registration_field_answers
    FOR SELECT
    USING (public.is_admin());

-- ── Trigger: update check_role_change to also use is_admin() ───────────────

CREATE OR REPLACE FUNCTION public.check_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Enforce only for authenticated app users. Dashboard sessions
    -- (SQL Editor = postgres, Table Editor = service_role) bypass this guard.
    IF COALESCE(auth.role(), '') = 'authenticated' AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
