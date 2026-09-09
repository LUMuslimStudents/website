-- Fix event_registrations FK: point user_id to auth.users so that anonymous
-- guest registrations (user_id = an anonymous auth.users id) don't require a
-- public.users profile row. Member registrations still work because
-- public.users.id mirrors auth.users.id.
BEGIN;

ALTER TABLE public.event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_user_id_fkey;
ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;
