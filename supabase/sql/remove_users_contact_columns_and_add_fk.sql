-- Migration: remove duplicated contact columns from public.users and add FK to auth.users
BEGIN;

-- Drop duplicated contact columns (if present)
ALTER TABLE IF EXISTS public.users DROP COLUMN IF EXISTS email;
ALTER TABLE IF EXISTS public.users DROP COLUMN IF EXISTS phone_number;

-- Add foreign key constraint linking public.users.id -> auth.users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE c.conname = 'fk_public_users_auth_users_id' AND t.relname = 'users'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT fk_public_users_auth_users_id
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END$$;

COMMIT;
