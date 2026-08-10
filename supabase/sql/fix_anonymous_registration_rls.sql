-- ============================================================================
-- Allow anonymous (guest) event registrations.
--
-- Problem: Existing policies use `auth.uid() = user_id`, which is NULL=NULL
-- for anonymous users → evaluates to NULL (not TRUE) → insert rejected.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- ── event_registrations: allow anonymous inserts ───────────────────────────

DROP POLICY IF EXISTS "registrations_insert_guest" ON public.event_registrations;
CREATE POLICY "registrations_insert_guest" ON public.event_registrations
    FOR INSERT
    WITH CHECK (
        (auth.uid() IS NULL AND user_id IS NULL)  -- anonymous guest
        OR
        (auth.uid() = user_id)                     -- signed-in member
    );

-- ── event_registration_profiles: allow insert for guest registrations ─────

DROP POLICY IF EXISTS "reg_profiles_insert_guest" ON public.event_registration_profiles;
CREATE POLICY "reg_profiles_insert_guest" ON public.event_registration_profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.event_registrations r
            WHERE r.id = registration_id
              AND r.user_id IS NULL           -- guest registration
              AND auth.uid() IS NULL          -- anonymous caller
        )
        OR
        EXISTS (
            SELECT 1 FROM public.event_registrations r
            WHERE r.id = registration_id
              AND r.user_id = auth.uid()      -- own registration
        )
    );

-- ── event_registration_field_answers: allow insert for guest registrations ─

DROP POLICY IF EXISTS "field_answers_insert_guest" ON public.event_registration_field_answers;
CREATE POLICY "field_answers_insert_guest" ON public.event_registration_field_answers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.event_registrations r
            WHERE r.id = registration_id
              AND r.user_id IS NULL           -- guest registration
              AND auth.uid() IS NULL          -- anonymous caller
        )
        OR
        EXISTS (
            SELECT 1 FROM public.event_registrations r
            WHERE r.id = registration_id
              AND r.user_id = auth.uid()      -- own registration
        )
    );
