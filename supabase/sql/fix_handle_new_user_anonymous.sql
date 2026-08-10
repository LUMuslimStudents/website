-- ============================================================================
-- Make handle_new_user skip anonymous users (they have no profile data).
-- Anonymous user IDs are still valid as foreign keys in event_registrations,
-- but they don't get a public.users row until they sign up properly.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip anonymous users — they have no profile data yet
  IF NEW.is_anonymous IS TRUE THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, first_name, last_name, phone_number, role, gender, study_program, term, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    'user',
    COALESCE((NEW.raw_user_meta_data->>'gender')::public."Gender", 'male'),
    COALESCE(NEW.raw_user_meta_data->>'study_program', ''),
    COALESCE(NEW.raw_user_meta_data->>'term', ''),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
