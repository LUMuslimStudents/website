-- Drop the password_reset_tokens table (not used with Supabase link-based flow)
DROP TABLE IF EXISTS public.password_reset_tokens;

-- Trigger: auto-create public.users row once a confirmed (non-anonymous)
-- auth.users row exists. Anonymous users (guest event registrations) and
-- unconfirmed signups don't get a public.users row. Runs with SECURITY DEFINER
-- so it bypasses RLS.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_anonymous IS TRUE THEN
    RETURN NEW;
  END IF;

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

-- Drop old trigger if it exists, then create
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
