-- Create members table for membership management
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  study_program TEXT NOT NULL,
  school_email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  membership_status TEXT NOT NULL DEFAULT 'pending' CHECK (membership_status IN ('pending', 'active', 'inactive')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_session_id TEXT,
  payment_id TEXT,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access for membership registration
CREATE POLICY "Allow public insert" ON public.members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.members
  FOR SELECT USING (true);

CREATE POLICY "Allow public update" ON public.members
  FOR UPDATE USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();