-- ============================================================================
-- Allow admins to UPDATE and DELETE event registrations.
--
-- Problem: `registrations_admin_read` is FOR SELECT only.
-- Admin status changes + deletes need UPDATE/DELETE policies.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- ── Admin UPDATE on event_registrations ────────────────────────────────────

DROP POLICY IF EXISTS "registrations_admin_write" ON public.event_registrations;
CREATE POLICY "registrations_admin_write" ON public.event_registrations
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ── Admin DELETE on event_registrations ────────────────────────────────────

DROP POLICY IF EXISTS "registrations_admin_delete" ON public.event_registrations;
CREATE POLICY "registrations_admin_delete" ON public.event_registrations
    FOR DELETE
    USING (public.is_admin());
