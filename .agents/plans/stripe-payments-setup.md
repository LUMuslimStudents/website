# Stripe Payments — Setup State & Plan

## Goal
- Membership payment at signup + event registration payments (SEK, Swedish site).
- Prisma schema = source of truth. **`prisma db push` DOES NOT WORK** (FKs to auth.users cross-schema). Deployment path is SQL: edit schema.postgres.prisma → `npx prisma generate` → write idempotent SQL in supabase/sql/ (setup.sql for fresh, fix_*.sql-style patches for live) → `npx supabase db query --linked -f <file>.sql` → update/re-apply rls_policies.sql → `npx supabase gen types typescript --linked > backend/supabase/types/types.ts`. (supabase/README.md codifies this.)

## Existing artifacts
- STRIPE-SETUP.md: old test-mode plan (create-checkout + payment-webhook Edge Functions)
- src/pages/StripeCheckout.tsx: unused stub w/ Stripe demo pk (embedded CheckoutProvider) — route commented out in App.tsx
- src/pages/PaymentSuccess.tsx: MOCK verification — replace with real verify-payment call
- event_registrations: has quoted_price + payment_required (hardcoded false in registrationPathways.ts, line ~384)
- admin_options: membership prices in whole SEK (150/300)
- swish/backend.ts: abandoned Swish experiment
- Existing Edge Functions (Deno): events-ics, validate-lu-email

## Agreed direction
- Hosted Stripe Checkout via redirectToCheckout (only @stripe/stripe-js dep); retire embedded stub
- **Future upgrade (explicit in plan): switch to embedded layout (ui_mode: 'embedded') later when the developer is ready** — same Checkout Sessions API; needs on-page mount component + domain registration for wallets + CSP headers. Backend/webhooks/DB unchanged.
- Edge Functions: create-checkout, payment-webhook, (verify-payment)
- Secrets: STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Supabase Edge Function secrets; VITE_STRIPE_PUBLISHABLE_KEY in .env
- Inline price_data from DB prices (no Stripe Products/Prices); server resolves price, never trusts client
- SEK is 2-decimal in Stripe → unit_amount in öre (×100)
- Webhook = source of truth; verify whsec signature; idempotent (unique stripe_session_id); service-role writes

## Planned schema changes
- event_registrations: +stripe_session_id (unique), +payment_status enum(unpaid|paid|refunded|failed), +payment_completed_at
- New table membership_payments (id, user_id, term, plan, amount, stripe_session_id, payment_status, paid_at)
- payment_required := quoted_price > 0 (server-side)
- Extend FORBIDDEN_REGISTRATION_BODY_KEYS with new payment fields

## Stripe tooling (user setup 2026-08-12)
- User created a Stripe MCP server + installed skills (skills-lock.json): stripe-best-practices, stripe-docs (CLI `stripe docs *`), stripe-projects, upgrade-stripe
- MCP server: https://mcp.stripe.com, configured in ~/.config/Code/User/mcp.json with rk_test key (Bearer auth)
- **MCP catalog is permission-filtered AND curated**: stripe_api_search only surfaces operations the rk_test key is permitted to do (e.g. customer list returns empty → key lacks perms). Docs list confirms: Checkout Sessions only has List + Retrieve — **Create Checkout Session is NOT a supported MCP method at all**. So PostCheckoutSessions unavailable regardless of key; `stripe_api_write` works only for methods in the curated catalog (customers, refunds, products, prices, payment links, webhook endpoints…). For checkout-session creation use the SDK in edge functions (proven working via direct API).
- Key verified 2026-08-12 via direct API: rk_test_ has checkout.sessions READ+WRITE (created cs_test_ session OK). Account acct_1OgsLgDmLnewmVgl, branding "LUMS", display_name "linktr.ee".
- Checkout Session minimum amount: 3.00 SEK (300 öre) — mind in tests with tiny amounts.
- Key skill rules: Checkout Sessions for one-time; NEVER pass payment_method_types (dynamic PMs); prefer RAK (rk_) over sk_; verify webhook signature; Node SDK 22 (have stripe ^22.5.0); API version 2026-07-29.dahlia; pass integration_identifier on checkout.sessions.create (label + 8 random letters); instantiate Stripe client instance (no global api_key pattern)

## Decisions (user answers 2026-08-12)
- MCP: registered via VS Code Chat 'Manage MCP Servers' UI
- Account: real Stripe account, test mode, pk_test/sk_test available
- Key: use restricted key (rk_) for edge functions — least privilege
- Membership timing: pay AFTER email verification, BEFORE first login (gate app content)
- MCP server name still unknown → ask user for exact name when starting Edit mode
