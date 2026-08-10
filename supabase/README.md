# Supabase Infrastructure

## Directory structure

```
supabase/
├── README.md              ← This file
├── functions/             ← Edge Functions
│   ├── events-ics/
│   └── validate-lu-email/
└── sql/                   ← Database SQL (apply via Supabase CLI)
    ├── setup.sql          ← Tables, FKs, RLS, enums — run for fresh projects
    ├── rls_policies.sql   ← RLS policies — safe to re-run anytime
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
   npx supabase db query --linked -f supabase/sql/setup.sql
   ```

4. Deploy edge functions:
   ```bash
   npx supabase functions deploy validate-lu-email
   npx supabase functions deploy events-ics
   ```

5. Set `.env`:
   ```env
   VITE_BACKEND=supabase
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

## Changing the database

The Prisma schema (`backend/prisma/schema.postgres.prisma`) is the source of truth for table shapes. To make a change:

1. Edit `schema.postgres.prisma`
2. Run `npx prisma generate` (updates frontend types)
3. Write the matching SQL in `supabase/sql/`
4. Apply it:
   ```bash
   npx supabase db query --linked -f supabase/sql/your_file.sql
   ```
5. Re-apply RLS policies:
   ```bash
   npx supabase db query --linked -f supabase/sql/rls_policies.sql
   ```

> `prisma db push` doesn't work here because our tables have foreign keys to `auth.users` (Supabase's internal schema). Prisma can't handle cross-schema references. SQL is the deployment path.

## Quick reference

```bash
# Apply a SQL file
npx supabase db query --linked -f supabase/sql/<file>.sql

# Apply RLS policies
npx supabase db query --linked -f supabase/sql/rls_policies.sql

# Deploy an edge function
npx supabase functions deploy <name>

# Regenerate frontend types
npx prisma generate

# Regenerate Supabase types (backend/)
npx supabase gen types typescript --linked > backend/supabase/types/types.ts
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

