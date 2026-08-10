-- Seed the current term with correct pricing
INSERT INTO public.admin_options (term, price_discounted_two_term, is_current)
VALUES ('HT26', 270, true)
ON CONFLICT (term) DO UPDATE SET
  price_discounted_two_term = 270,
  is_current = true;

-- Ensure no other term is marked as current
UPDATE public.admin_options SET is_current = false WHERE term != 'HT26';

SELECT * FROM public.admin_options;
