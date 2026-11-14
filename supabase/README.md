# Supabase Infrastructure

## Directory structure

```
supabase/
├── README.md              ← This file
├── config.toml            ← CLI config (project pin, per-function settings)
├── functions/             ← Edge Functions
│   ├── events-ics/
│   ├── sync-social-stats/ ← Daily Instagram follower sync (cron-driven)
│   └── validate-lu-email/
└── sql/                   ← Database SQL (apply via Supabase CLI)
    ├── setup.sql          ← Tables, FKs, RLS, enums — run for fresh projects
    ├── rls_policies.sql   ← RLS policies — safe to re-run anytime
    ├── social_stats.sql   ← social_stats table + public-read policy
    ├── sync_social_stats_cron.sql ← pg_cron daily job for the sync function
    ├── stat_totals.sql    ← lifetime counters, payment trigger, site_stats view
    ├── refresh_stat_totals_cron.sql ← pg_cron nightly reconciliation
    └── fix_event_registrations_fk.sql
```

## Setup from scratch

1. Create a Supabase project → link it:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   ```

2. Configure Authentication in the Supabase Dashboard:
   - Enable "Email confirmations"
   - Add redirect URL: `https://yourdomain.com/reset-password`

3. Deploy the database:
   ```bash
   npx supabase db query --remote -f supabase/sql/setup.sql
   ```

4. Deploy edge functions:
   ```bash
   npx supabase functions deploy validate-lu-email
   npx supabase functions deploy events-ics
   npx supabase functions deploy sync-social-stats
   ```
   Per-function settings (e.g. `verify_jwt`) live in `supabase/config.toml`.

5. Social stats sync (optional — Instagram follower count):
   ```bash
   npx supabase secrets set IG_USER_ID=<ig-user-id> IG_ACCESS_TOKEN=<token>
   npx supabase db query --remote -f supabase/sql/social_stats.sql
   npx supabase db query --remote -f supabase/sql/sync_social_stats_cron.sql
   ```
   Requires an Instagram Business/Creator account. The cron job runs at 03:17
   UTC; check it with:
   ```sql
   select jobname, schedule, active from cron.job;
   select status_code, content from net._http_response order by created desc limit 5;
   ```

6. Organisation stats (About page counters):
   ```bash
   npx supabase db query --remote -f supabase/sql/stat_totals.sql
   npx supabase db query --remote -f supabase/sql/refresh_stat_totals_cron.sql
   ```
   Seeds `base_value` (308 members, 50 events from before the website) and
   computes the current totals. From then on:
   - members grow by terms granted on each successful membership payment, and
     are **never decremented** — safe across GDPR purges
   - events are recounted nightly at 03:20 UTC from `events_info`

   The page reads one view: `select * from public.site_stats;`

   > A member purge must never delete or reset `public.stat_totals`. It holds
   > only integers, no personal data.

7. Set `.env`:
   ```env
   VITE_BACKEND=supabase
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

## Changing the database

The Prisma schema (`backend/prisma/schema.postgres.prisma`) is the source of truth for table shapes. To make a change:

1. Edit `schema.postgres.prisma`
2. Run `npx prisma generate` (updates the client in `backend/generated/prisma`)
   > Prisma 7 outputs the client to `backend/generated/prisma` and it is
   > gitignored — run this after cloning or switching branches. Imports use the
   > generated path (`backend/generated/prisma/client`), and the REST backend
   > instantiates the client with the `@prisma/adapter-pg` adapter.
3. Write the matching SQL in `supabase/sql/`
4. Apply it:
   ```bash
   npx supabase db query --remote -f supabase/sql/your_file.sql
   ```
5. Re-apply RLS policies:
   ```bash
   npx supabase db query --remote -f supabase/sql/rls_policies.sql
   ```

> `prisma db push` doesn't work here because our tables have foreign keys to `auth.users` (Supabase's internal schema). Prisma can't handle cross-schema references. SQL is the deployment path.

## Quick reference

```bash
# Apply a SQL file
npx supabase db query --remote -f supabase/sql/<file>.sql

# Apply RLS policies
npx supabase db query --remote -f supabase/sql/rls_policies.sql

# Deploy an edge function
npx supabase functions deploy <name>

# Regenerate frontend types
npx prisma generate

# Regenerate Supabase types (backend/)
npx supabase gen types typescript --remote > backend/supabase/types/types.ts
```

## User table pattern

```
auth.users (Supabase)                public.users (ours)
├── id (UUID) ◄─────── FK ────────├── id (UUID)
├── email                         ├── first_name
├── encrypted_password            ├── last_name
└── email_confirmed_at            ├── role, gender, study_program, term
                                  └── created_at
```

During signup, profile fields go into `auth.users.raw_user_meta_data`. After email confirmation, they're synced to `public.users`.

