-- ============================================================================
-- Transactions — single ledger for ALL payments (event, membership, donation).
-- Replaces the per-table payment columns on event_registrations and
-- membership_payments with a transaction_id link. Safe to re-run.
--
-- Apply against the live DB:
--   npx supabase db query --linked -f supabase/sql/add_transactions.sql
-- Then re-apply RLS policies (transactions policies + updated payment trigger):
--   npx supabase db query --linked -f supabase/sql/rls_policies.sql
-- ============================================================================

-- ── Enum ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE "public"."TransactionSource" AS ENUM ('event', 'membership', 'donation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── transactions table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
    id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID                  REFERENCES public.users(id) ON DELETE CASCADE,
    source            "TransactionSource"   NOT NULL,
    term              VARCHAR(4)            NOT NULL,
    amount            INT                   NOT NULL,
    currency          VARCHAR(3)            NOT NULL DEFAULT 'sek',
    stripe_session_id VARCHAR(255)          UNIQUE,
    payment_status    "PaymentStatus"       NOT NULL DEFAULT 'unpaid',
    paid_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user
    ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source_term
    ON public.transactions (source, term);

-- ── Add transaction_id link columns (before dropping old payment columns) ──
ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_registrations_transaction
    ON public.event_registrations (transaction_id);

ALTER TABLE public.membership_payments
    ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_membership_payments_transaction
    ON public.membership_payments (transaction_id);

-- ── Backfill existing payments into transactions ────────────────────────────
-- Event payments: only rows that actually reached checkout (have a session).
-- Free registrations (payment_required = false) never get a transaction.
INSERT INTO public.transactions (id, user_id, source, term, amount, currency, stripe_session_id, payment_status, paid_at, created_at)
SELECT
    gen_random_uuid(),
    r.user_id,
    'event'::"TransactionSource",
    e.term,
    r.quoted_price,
    'sek',
    r.stripe_session_id,
    r.payment_status,
    r.payment_completed_at,
    r.submitted_at
FROM public.event_registrations r
JOIN public.events_info e ON e.id = r.event_id
WHERE r.stripe_session_id IS NOT NULL
  AND r.transaction_id IS NULL;

UPDATE public.event_registrations r
SET transaction_id = t.id
FROM public.transactions t
WHERE t.stripe_session_id = r.stripe_session_id
  AND r.transaction_id IS NULL;

-- Membership payments: one transaction per membership payment row.
INSERT INTO public.transactions (id, user_id, source, term, amount, currency, stripe_session_id, payment_status, paid_at, created_at)
SELECT
    gen_random_uuid(),
    m.user_id,
    'membership'::"TransactionSource",
    m.term,
    m.amount,
    'sek',
    m.stripe_session_id,
    m.payment_status,
    m.paid_at,
    m.created_at
FROM public.membership_payments m
WHERE m.stripe_session_id IS NOT NULL
  AND m.transaction_id IS NULL;

UPDATE public.membership_payments m
SET transaction_id = t.id
FROM public.transactions t
WHERE t.stripe_session_id = m.stripe_session_id
  AND m.transaction_id IS NULL;

-- ── Drop the old per-table payment columns ──────────────────────────────────
DROP INDEX IF EXISTS uniq_event_registrations_stripe_session;
ALTER TABLE public.event_registrations
    DROP COLUMN IF EXISTS stripe_session_id,
    DROP COLUMN IF EXISTS payment_status,
    DROP COLUMN IF EXISTS payment_completed_at;

ALTER TABLE public.membership_payments
    DROP COLUMN IF EXISTS amount,
    DROP COLUMN IF EXISTS stripe_session_id,
    DROP COLUMN IF EXISTS payment_status,
    DROP COLUMN IF EXISTS paid_at;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
