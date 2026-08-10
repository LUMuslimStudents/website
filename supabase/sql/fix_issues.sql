-- Drop the password_reset_tokens table (not used with Supabase link-based flow)
DROP TABLE IF EXISTS public.password_reset_tokens;

-- Trigger: auto-create public.users row when a new auth.users row is inserted.
-- This runs with SECURITY DEFINER so it bypasses RLS.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, role, gender, study_program, term, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'user',
    COALESCE((NEW.raw_user_meta_data->>'gender')::public."Gender", 'male'),
    COALESCE(NEW.raw_user_meta_data->>'study_program', ''),
    COALESCE(NEW.raw_user_meta_data->>'term', ''),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
