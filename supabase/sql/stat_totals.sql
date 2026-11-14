-- ============================================================================
-- Organisation stats — lifetime counters for the About page.
-- Run once per project. Safe to re-run: the seed uses ON CONFLICT DO NOTHING,
-- and every other statement is CREATE OR REPLACE / IF NOT EXISTS.
--
-- Why counters instead of live counts:
--   * "Members so far" counts memberships granted (terms), and member rows are
--     deleted for GDPR. A live count would lose history every purge, so the
--     total is accumulated as an integer and never decremented.
--   * "Events hosted so far" is append-only (events are never deleted), so it
--     is reconciled nightly against events_info.
--
-- GDPR: this table stores two integers per metric and no personal data. A
-- member purge must NOT delete or reset these rows.
-- ============================================================================

-- ── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stat_totals (
    metric         TEXT        PRIMARY KEY,
    base_value     INTEGER     NOT NULL DEFAULT 0 CHECK (base_value >= 0),
    lifetime_count INTEGER     NOT NULL DEFAULT 0 CHECK (lifetime_count >= 0),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stat_totals IS
    'Lifetime counters for public site stats. Integers only; safe to keep across GDPR member purges.';
COMMENT ON COLUMN public.stat_totals.base_value IS
    'History from before the website existed (members: 308, events: 50). Editable without a deploy.';
COMMENT ON COLUMN public.stat_totals.lifetime_count IS
    'Accumulated since the website launched. Never decremented.';

-- ── Seed ────────────────────────────────────────────────────────────────────
-- ON CONFLICT DO NOTHING: re-running this file must never reset a counter.

INSERT INTO public.stat_totals (metric, base_value, lifetime_count)
VALUES
    (
        'members_total',
        308,
        (
            -- Terms granted so far: a two_term plan counts twice.
            SELECT COALESCE(SUM(CASE WHEN mp.plan = 'two_term' THEN 2 ELSE 1 END), 0)::INTEGER
              FROM public.transactions t
              LEFT JOIN public.membership_payments mp ON mp.transaction_id = t.id
             WHERE t.source = 'membership'
               AND t.payment_status = 'paid'
        )
    ),
    (
        'events_total',
        50,
        (SELECT COUNT(*)::INTEGER FROM public.events_info WHERE date <= CURRENT_DATE)
    )
ON CONFLICT (metric) DO NOTHING;

-- ── Members: increment on a successful membership payment ───────────────────

CREATE OR REPLACE FUNCTION public.bump_members_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    terms INTEGER;
BEGIN
    -- The membership row carries the plan, which decides how many terms this
    -- payment grants. Missing row (should not happen) counts as one term.
    SELECT CASE WHEN mp.plan = 'two_term' THEN 2 ELSE 1 END
      INTO terms
      FROM public.membership_payments mp
     WHERE mp.transaction_id = NEW.id;

    UPDATE public.stat_totals
       SET lifetime_count = lifetime_count + COALESCE(terms, 1),
           updated_at = now()
     WHERE metric = 'members_total';

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS transactions_bump_members ON public.transactions;
CREATE TRIGGER transactions_bump_members
    AFTER UPDATE OF payment_status ON public.transactions
    FOR EACH ROW
    WHEN (
        NEW.source = 'membership'
        AND NEW.payment_status = 'paid'
        AND OLD.payment_status IS DISTINCT FROM 'paid'
    )
    EXECUTE FUNCTION public.bump_members_total();

-- ── Nightly reconciliation ──────────────────────────────────────────────────
-- Events: events_info is the source of truth (nothing is ever deleted).
-- Members: a safety net only — the trigger is the primary path. GREATEST can
-- never lower a counter, so a purge (which empties transactions) is harmless
-- and a missed trigger gets healed on the next run.

CREATE OR REPLACE FUNCTION public.refresh_stat_totals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.stat_totals st
       SET lifetime_count = GREATEST(
               st.lifetime_count,
               (SELECT COUNT(*)::INTEGER
                  FROM public.events_info
                 WHERE date <= CURRENT_DATE)
           ),
           updated_at = now()
     WHERE st.metric = 'events_total';

    UPDATE public.stat_totals st
       SET lifetime_count = GREATEST(
               st.lifetime_count,
               (SELECT COALESCE(SUM(CASE WHEN mp.plan = 'two_term' THEN 2 ELSE 1 END), 0)::INTEGER
                  FROM public.transactions t
                  LEFT JOIN public.membership_payments mp ON mp.transaction_id = t.id
                 WHERE t.source = 'membership'
                   AND t.payment_status = 'paid')
           ),
           updated_at = now()
     WHERE st.metric = 'members_total';
END;
$$;

-- Functions default to EXECUTE for PUBLIC, which would expose
-- refresh_stat_totals() as a callable /rpc endpoint. Triggers do not require
-- EXECUTE privileges, so revoking is safe and keeps it internal.
REVOKE ALL ON FUNCTION public.bump_members_total() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_stat_totals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_stat_totals() TO service_role;

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.stat_totals ENABLE ROW LEVEL SECURITY;

-- Public read: these are marketing numbers. Writes happen through the
-- SECURITY DEFINER functions above (or the dashboard), never from a client.
DROP POLICY IF EXISTS "stat_totals_read" ON public.stat_totals;
CREATE POLICY "stat_totals_read" ON public.stat_totals
    FOR SELECT
    USING (true);

GRANT SELECT ON public.stat_totals TO anon, authenticated;
GRANT ALL    ON public.stat_totals TO service_role;

-- ── Public view ─────────────────────────────────────────────────────────────
-- One row per metric, so the site makes a single request.
-- security_invoker: the caller's RLS applies to the underlying tables. All of
-- them are publicly readable (stat_totals, social_stats) and none expose PII.

CREATE OR REPLACE VIEW public.site_stats
WITH (security_invoker = true) AS
    SELECT 'members_total'::TEXT AS metric,
           (base_value + lifetime_count)::BIGINT AS value
      FROM public.stat_totals
     WHERE metric = 'members_total'
    UNION ALL
    SELECT 'events_total',
           (base_value + lifetime_count)::BIGINT
      FROM public.stat_totals
     WHERE metric = 'events_total'
    UNION ALL
    SELECT 'instagram_followers',
           follower_count::BIGINT
      FROM public.social_stats
     WHERE platform = 'instagram'
    UNION ALL
    SELECT 'years_active',
           DATE_PART('year', AGE(CURRENT_DATE, DATE '2022-09-01'))::BIGINT;

COMMENT ON VIEW public.site_stats IS
    'Public statistics for the About page. Computed; no personal data.';

GRANT SELECT ON public.site_stats TO anon, authenticated;
GRANT ALL    ON public.site_stats TO service_role;

-- PostgREST caches the schema; make the new view visible immediately.
NOTIFY pgrst, 'reload schema';
