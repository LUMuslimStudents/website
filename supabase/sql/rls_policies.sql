-- ============================================================================
-- RLS Policies
-- Run this to add/update RLS policies on an existing database.
-- Safe to re-run — uses DROP IF EXISTS / CREATE.
-- Uses public.is_admin() (SECURITY DEFINER) to avoid infinite recursion.
-- ============================================================================

-- ── Helper: SECURITY DEFINER to break recursion cycles ─────────────────────

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

-- ── public.users ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "users_read_own" ON public.users;
CREATE POLICY "users_read_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "admins_read_all_users" ON public.users;
CREATE POLICY "admins_read_all_users" ON public.users
    FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admins_update_users" ON public.users;
CREATE POLICY "admins_update_users" ON public.users
    FOR UPDATE
    USING (public.is_admin());

-- ── Trigger: prevent non-admins from changing roles ────────────────────────

DROP TRIGGER IF EXISTS prevent_role_escalation ON public.users;
CREATE OR REPLACE FUNCTION public.check_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_change();

-- ── public.events_info ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "events_public_read" ON public.events_info;
CREATE POLICY "events_public_read" ON public.events_info
    FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "events_admin_read" ON public.events_info;
CREATE POLICY "events_admin_read" ON public.events_info
    FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "events_admin_write" ON public.events_info;
CREATE POLICY "events_admin_write" ON public.events_info
    FOR ALL
    USING (public.is_admin());

-- ── public.event_registrations ──────────────────────────────────────────────

DROP POLICY IF EXISTS "registrations_own" ON public.event_registrations;
CREATE POLICY "registrations_own" ON public.event_registrations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "registrations_admin_read" ON public.event_registrations;
CREATE POLICY "registrations_admin_read" ON public.event_registrations
    FOR SELECT
    USING (public.is_admin());

-- ── public.event_registration_profiles ──────────────────────────────────────

DROP POLICY IF EXISTS "reg_profiles_own" ON public.event_registration_profiles;
CREATE POLICY "reg_profiles_own" ON public.event_registration_profiles
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.event_registrations r
        WHERE r.id = registration_id AND r.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "reg_profiles_admin_read" ON public.event_registration_profiles;
CREATE POLICY "reg_profiles_admin_read" ON public.event_registration_profiles
    FOR SELECT
    USING (public.is_admin());

-- ── public.event_form_fields ────────────────────────────────────────────────

DROP POLICY IF EXISTS "form_fields_public_read" ON public.event_form_fields;
CREATE POLICY "form_fields_public_read" ON public.event_form_fields
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "form_fields_admin_write" ON public.event_form_fields;
CREATE POLICY "form_fields_admin_write" ON public.event_form_fields
    FOR ALL
    USING (public.is_admin());

-- ── public.event_registration_field_answers ─────────────────────────────────

DROP POLICY IF EXISTS "field_answers_own" ON public.event_registration_field_answers;
CREATE POLICY "field_answers_own" ON public.event_registration_field_answers
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.event_registrations r
        WHERE r.id = registration_id AND r.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "field_answers_admin_read" ON public.event_registration_field_answers;
CREATE POLICY "field_answers_admin_read" ON public.event_registration_field_answers
    FOR SELECT
    USING (public.is_admin());

-- ── public.admin_options ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_options_read" ON public.admin_options;
CREATE POLICY "admin_options_read" ON public.admin_options
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "admin_options_insert" ON public.admin_options;
CREATE POLICY "admin_options_insert" ON public.admin_options
    FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_options_update" ON public.admin_options;
CREATE POLICY "admin_options_update" ON public.admin_options
    FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "admin_options_delete" ON public.admin_options;
CREATE POLICY "admin_options_delete" ON public.admin_options
    FOR DELETE
    USING (public.is_admin());
