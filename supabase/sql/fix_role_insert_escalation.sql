-- ============================================================================
-- Fix: prevent role escalation via INSERT.
--
-- Gap (now closed at two levels): the `users_insert_own` RLS policy let any
-- user (including anonymous users, who have a real auth.uid()) insert their
-- own row, and nothing forced `role` to 'user' on INSERT. So an attacker
-- could insert themselves with role = 'admin'.
--
-- Fix: a BEFORE INSERT trigger that forces role = 'user' for any
-- authenticated non-admin request. Dashboard sessions (SQL Editor =
-- postgres, Table Editor = service_role) are unaffected.
--
-- Since then, `users_insert_own` / `users_update_own` were dropped entirely
-- (see remove_user_self_write.sql) — this trigger remains as defense in
-- depth.
--
-- Run with: npx supabase db query --linked -f supabase/sql/fix_role_insert_escalation.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_role_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'authenticated' AND NOT public.is_admin() THEN
    NEW.role := 'user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_insert_escalation ON public.users;
CREATE TRIGGER prevent_role_insert_escalation
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_insert();
