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

-- Users have NO self-write access: rows are created by the server-side
-- handle_new_user trigger and updated only by admins (or dashboard sessions).
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

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
    -- Enforce only for authenticated app users. Dashboard sessions
    -- (SQL Editor = postgres, Table Editor = service_role) bypass this guard.
    IF COALESCE(auth.role(), '') = 'authenticated' AND NOT public.is_admin() THEN
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

-- ── Trigger: force role='user' on non-admin inserts ────────────────────────

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

-- ── public.membership_payments ──────────────────────────────────────────────

DROP POLICY IF EXISTS "membership_payments_own_read" ON public.membership_payments;
CREATE POLICY "membership_payments_own_read" ON public.membership_payments
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "membership_payments_admin_read" ON public.membership_payments;
CREATE POLICY "membership_payments_admin_read" ON public.membership_payments
    FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "membership_payments_admin_write" ON public.membership_payments;
CREATE POLICY "membership_payments_admin_write" ON public.membership_payments
    FOR ALL
    USING (public.is_admin());

-- ── Trigger: payment fields on event_registrations are webhook/admin only ───
-- Users may update their own registration row (RLS "registrations_own"), but
-- they must never flip payment_status, stripe_session_id, quoted_price, or
-- payment_required. Service-role (webhook) bypasses RLS but triggers still
-- fire, so service_role and admins (manual cash payments) are allowed here.

DROP TRIGGER IF EXISTS prevent_payment_field_edits ON public.event_registrations;
DROP TRIGGER IF EXISTS prevent_payment_field_inserts ON public.event_registrations;

CREATE OR REPLACE FUNCTION public.check_payment_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL THEN
    RETURN NEW; -- direct DB access (SQL editor, migrations)
  END IF;

  IF COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role' THEN
    RETURN NEW; -- webhook writes via service-role key
  END IF;

  IF public.is_admin() THEN
    RETURN NEW; -- admins may manually mark paid (e.g. cash at the door)
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.quoted_price > 0 AND NEW.payment_required = false THEN
      RAISE EXCEPTION 'Paid registrations must be marked payment_required';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
     OR NEW.payment_completed_at IS DISTINCT FROM OLD.payment_completed_at
     OR NEW.quoted_price IS DISTINCT FROM OLD.quoted_price
     OR NEW.payment_required IS DISTINCT FROM OLD.payment_required THEN
    RAISE EXCEPTION 'Payment fields can only be updated by the payment system';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_payment_field_edits
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_payment_fields();

CREATE TRIGGER prevent_payment_field_inserts
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_payment_fields();
