-- ============================================================================
-- Make handle_new_user skip anonymous users AND unconfirmed signups.
--
-- Anonymous user IDs are still valid as foreign keys in event_registrations
-- and transactions (those now reference auth.users directly), so they don't
-- get a public.users row. Real members get a public.users row only once their
-- email is confirmed — this keeps an unconfirmed signup (e.g. a mistyped
-- email) from reserving the UNIQUE phone_number.
--
-- Run this in the Supabase SQL Editor, or:
--   npx supabase db query --linked -f supabase/sql/fix_handle_new_user_anonymous.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip anonymous users — they have no profile data yet.
  IF NEW.is_anonymous IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Only create the profile once the email is confirmed.
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, first_name, last_name, phone_number, role, gender, study_program, term, created_at)
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
