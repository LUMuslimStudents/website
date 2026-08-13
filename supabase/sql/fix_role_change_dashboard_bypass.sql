-- ============================================================================
-- Fix: allow the project owner to change user roles from the Supabase
-- dashboard (SQL Editor / Table Editor as service_role), while still
-- preventing non-admin app users (JWT role = 'authenticated') from
-- escalating roles.
--
-- Run with: npx supabase db query --linked -f supabase/sql/fix_role_change_dashboard_bypass.sql
-- ============================================================================

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
