-- ============================================================================
-- Supabase Storage RLS: events bucket policies
--
-- Requires the 'events' bucket to exist (created via Storage dashboard).
-- Policies restrict INSERT + UPDATE to admin users only.
-- SELECT is public (bucket is public).
--
-- Applied via: npx supabase db push
-- ============================================================================

-- Allow admins to upload images
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 'Admin upload', 'events', 'INSERT', '(SELECT public.is_admin())'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies WHERE bucket_id = 'events' AND operation = 'INSERT'
);

-- Allow admins to overwrite/update images
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 'Admin update', 'events', 'UPDATE', '(SELECT public.is_admin())'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies WHERE bucket_id = 'events' AND operation = 'UPDATE'
);

-- Allow admins to delete images (optional, for cleanup)
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 'Admin delete', 'events', 'DELETE', '(SELECT public.is_admin())'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies WHERE bucket_id = 'events' AND operation = 'DELETE'
);
