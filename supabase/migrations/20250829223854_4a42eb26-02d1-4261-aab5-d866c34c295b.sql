-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for newsletter subscribers
CREATE POLICY "Allow public insert" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.newsletter_subscribers
  FOR SELECT USING (true);

-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('event', 'activity', 'improvement', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies for suggestions
CREATE POLICY "Allow public insert" ON public.suggestions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.suggestions
  FOR SELECT USING (true);

-- Create trigger for automatic timestamp updates on suggestions
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();