-- ============================================================================
-- Nightly reconciliation of public site stats.
-- Run once per project. Safe to re-run — unschedules then reschedules the job.
--
-- Pure SQL: no edge function and no network, so there is nothing to time out.
--   * events_total is recounted from events_info (append-only source of truth)
--   * members_total is only ever raised, never lowered — a GDPR purge deletes
--     transactions, and GREATEST keeps the accumulated total intact.
--
-- pg_cron runs in UTC. 03:20 is three minutes after the Instagram sync.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('refresh-stat-totals')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-stat-totals');

SELECT cron.schedule(
    'refresh-stat-totals',
    '20 3 * * *',
    $$
    SELECT public.refresh_stat_totals();
    $$
);
