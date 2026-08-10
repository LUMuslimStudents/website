-- Fix event_registrations FK: point to public.users instead of auth.users
-- Prisma schema expects event_registrations.user_id → public.users.id
-- public.users.id already has an FK to auth.users.id
BEGIN;

-- Drop the old FK pointing directly to auth.users
ALTER TABLE IF EXISTS public.event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_user_id_fkey_auth_users;

-- Add FK pointing to public.users (which itself references auth.users)
-- Only add if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        WHERE c.conname = 'event_registrations_user_id_fkey'
          AND c.conrelid = 'public.event_registrations'::regclass
    ) THEN
        ALTER TABLE public.event_registrations
          ADD CONSTRAINT event_registrations_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
END$$;

COMMIT;
