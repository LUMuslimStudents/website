-- ============================================================================
-- Revoke direct client writes to event registrations.
--
-- Registration creation now happens in the `register-event` Edge Function,
-- which runs with the service-role key and derives price, eligibility,
-- deadline, status, and payment requirements server-side. This file removes
-- the permissive user INSERT/UPDATE/DELETE policies so a direct API caller can
-- no longer forge registrations (e.g. quoted_price=0, status=confirmed).
--
-- Users keep READ access to their own registration; admins keep UPDATE/DELETE
-- (check-in, status changes, cancellations from the dashboard).
--
-- Run this in the Supabase SQL Editor, or:
--   npx supabase db query --linked -f supabase/sql/lock_registration_writes.sql
-- ============================================================================

-- ── event_registrations: users may READ their own rows only ────────────────

DROP POLICY IF EXISTS "registrations_own" ON public.event_registrations;
CREATE POLICY "registrations_own" ON public.event_registrations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Remove the legacy anonymous-guest INSERT path (replaced by register-event).
DROP POLICY IF EXISTS "registrations_insert_guest" ON public.event_registrations;

-- ── event_registrations: admins keep UPDATE + DELETE ───────────────────────

DROP POLICY IF EXISTS "registrations_admin_write" ON public.event_registrations;
CREATE POLICY "registrations_admin_write" ON public.event_registrations
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "registrations_admin_delete" ON public.event_registrations;
CREATE POLICY "registrations_admin_delete" ON public.event_registrations
    FOR DELETE
    USING (public.is_admin());

-- ── event_registration_profiles: users may READ via their registration ─────

DROP POLICY IF EXISTS "reg_profiles_own" ON public.event_registration_profiles;
CREATE POLICY "reg_profiles_own" ON public.event_registration_profiles
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.event_registrations r
        WHERE r.id = registration_id AND r.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "reg_profiles_insert_guest" ON public.event_registration_profiles;

-- ── event_registration_field_answers: users may READ via their registration ─

DROP POLICY IF EXISTS "field_answers_own" ON public.event_registration_field_answers;
CREATE POLICY "field_answers_own" ON public.event_registration_field_answers
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.event_registrations r
        WHERE r.id = registration_id AND r.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "field_answers_insert_guest" ON public.event_registration_field_answers;
