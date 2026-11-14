-- ============================================================================
-- Daily social-stats sync.
-- Run once per project. Safe to re-run — unschedules and reschedules the job.
--
-- The key below is the project's PUBLISHABLE key: it already ships in the
-- website bundle, so it is not a secret and is safe to commit. It only carries
-- the request past the function's JWT check — all writes happen server-side
-- with the service role.
--
-- pg_cron runs in UTC. 03:17 UTC = 04:17 winter / 05:17 summer in Lund,
-- deliberately off the hour to avoid the top-of-hour stampede.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent: drop the previous job before creating it again.
SELECT cron.unschedule('sync-social-stats')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-social-stats');

SELECT cron.schedule(
    'sync-social-stats',
    '17 3 * * *',
    $$
    SELECT net.http_post(
        url := 'https://vcvbjvmqdjjlidrulbel.supabase.co/functions/v1/sync-social-stats',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', 'sb_publishable_ngtdl-X692WEwRFY9-VF7Q_XjiSQ_GP',
            'Authorization', 'Bearer sb_publishable_ngtdl-X692WEwRFY9-VF7Q_XjiSQ_GP'
        ),
        body := '{}'::jsonb,
        -- Default is 1000ms — too short for an edge-function cold start.
        timeout_milliseconds := 15000
    );
    $$
);

-- ── Checking it later ──────────────────────────────────────────────────────
--   select jobname, schedule, active from cron.job;
--   select status, return_message, start_time from cron.job_run_details
--     order by start_time desc limit 5;
--   select status_code, content from net._http_response
--     order by created desc limit 5;
--   select platform, follower_count, synced_at from public.social_stats;
