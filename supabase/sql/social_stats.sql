-- ============================================================================
-- Social stats — follower counts synced daily from the Graph API.
-- Run this in the Supabase SQL Editor (or via the CLI). Safe to re-run —
-- uses IF NOT EXISTS / DROP IF EXISTS.
--
-- Rows are written only by the `sync-social-stats` edge function (service
-- role) and read anonymously by the website.
-- ============================================================================

-- ── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.social_stats (
    platform       TEXT        PRIMARY KEY,
    follower_count INTEGER     NOT NULL CHECK (follower_count >= 0),
    handle         TEXT,
    synced_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.social_stats IS
    'Latest follower counts per platform, refreshed by the sync-social-stats edge function.';

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.social_stats ENABLE ROW LEVEL SECURITY;

-- Public read: these numbers are marketing copy, shown to signed-out visitors.
DROP POLICY IF EXISTS "social_stats_read" ON public.social_stats;
CREATE POLICY "social_stats_read" ON public.social_stats
    FOR SELECT
    USING (true);

-- Deliberately no INSERT/UPDATE/DELETE policies — writes go through the
-- service role inside the edge function, which bypasses RLS.

-- ── Data API grants ─────────────────────────────────────────────────────────
-- New tables are not always auto-exposed on the Data API, so grant the read
-- path explicitly (this is separate from RLS, which filters rows).

GRANT SELECT ON public.social_stats TO anon, authenticated;
GRANT ALL    ON public.social_stats TO service_role;
