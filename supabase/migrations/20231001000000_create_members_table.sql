
-- Create members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    study_program TEXT NOT NULL,
    school_email TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    membership_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'expired'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    payment_id TEXT,
    payment_session_id TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create RLS policies for members table
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to insert (for registration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'members' AND policyname = 'members_insert_policy'
    ) THEN
        CREATE POLICY members_insert_policy ON public.members 
            FOR INSERT 
            TO anon
            WITH CHECK (true);
    END IF;
END
$$;

-- Create policy to allow service role to select, update, and delete
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'members' AND policyname = 'members_service_policy'
    ) THEN
        CREATE POLICY members_service_policy ON public.members 
            USING (true)
            WITH CHECK (true);
    END IF;
END
$$;

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid errors during re-runs
DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;

-- Create trigger
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
