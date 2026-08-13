-- ============================================================================
-- Stripe Payments — Add payment fields to event_registrations and the new
-- membership_payments table. Safe to re-run.
--
-- Apply against the live DB:
--   npx supabase db query --linked -f supabase/sql/add_stripe_payments.sql
--
-- Then re-apply RLS policies (includes payment-field triggers):
--   npx supabase db query --linked -f supabase/sql/rls_policies.sql
-- ============================================================================

-- ── Enum types ──────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE "public"."PaymentStatus" AS ENUM ('unpaid', 'paid', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."MembershipPlan" AS ENUM ('single_term', 'two_term');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── event_registrations: payment columns ────────────────────────────────────
ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS stripe_session_id    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_status       "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Multiple NULLs are allowed in Postgres unique indexes, so existing rows
-- (all NULL) do not conflict.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_registrations_stripe_session
    ON public.event_registrations (stripe_session_id);

-- ── membership_payments table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.membership_payments (
    id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID             NOT NULL REFERENCES public.users(id),
    term              VARCHAR(4)       NOT NULL,
    plan              "MembershipPlan" NOT NULL,
    amount            INT              NOT NULL,
    stripe_session_id VARCHAR(255)     UNIQUE,
    payment_status    "PaymentStatus"  NOT NULL DEFAULT 'unpaid',
    paid_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_payments_user_term
    ON public.membership_payments (user_id, term);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Policies for this table live in rls_policies.sql.
ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;
