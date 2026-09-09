-- ============================================================================
-- Fix: anonymous + unconfirmed signups polluting public.users
--
-- Two production bugs:
--   1. handle_new_user created a public.users row for EVERY auth.users insert,
--      including anonymous users (guest event registrations) and unconfirmed
--      email signups. Anonymous guests only sign up to events and must never
--      get a member profile row.
--   2. Because public.users.phone_number is UNIQUE, an unconfirmed signup
--      (e.g. a mistyped email) reserved the phone number immediately, so a
--      corrected retry with the same phone failed with a unique violation.
--
-- Fix:
--   * handle_new_user now skips anonymous users and only inserts once the
--     email is confirmed (email_confirmed_at is set).
--   * A second trigger creates the profile at confirmation time.
--   * event_registrations.user_id and transactions.user_id now reference
--     auth.users directly, so anonymous guest registrations/payments no longer
--     need a public.users row. membership_payments keeps referencing
--     public.users (members only).
--   * Deletes the bad public.users rows that were already created.
--
-- Apply:
--   npx supabase db query --linked -f supabase/sql/fix_signup_anonymous_and_confirmation.sql
-- ============================================================================

-- ── 1. Corrected profile trigger ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymous users only exist for guest event registrations and never get a
  -- public profile row.
  IF NEW.is_anonymous IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Do not create the profile until the email is confirmed. This prevents an
  -- unconfirmed signup (e.g. a mistyped email) from reserving the UNIQUE
  -- phone_number and blocking a corrected retry.
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (
    id, first_name, last_name, phone_number, role, gender, study_program, term, created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone_number', ''), ''),
    'user',
    COALESCE((NEW.raw_user_meta_data->>'gender')::public."Gender", 'male'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'study_program', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'term', ''), ''),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 2. Point guest-facing FKs at auth.users ─────────────────────────────────

ALTER TABLE public.event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_user_id_fkey;
ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── 3. Remove the bad public.users rows already created ─────────────────────
-- Deletes public.users for anonymous users and unconfirmed email signups.
-- Safe: guest registrations/payments now reference auth.users directly, so
-- this no longer cascades to their event_registrations/transactions rows.

DELETE FROM public.users p
USING auth.users a
WHERE a.id = p.id
  AND (a.is_anonymous IS TRUE OR a.email_confirmed_at IS NULL);
