# Embedded Checkout Migration Plan (next dev session)

**Goal:** Replace the hosted redirect flow (`window.location.assign(session.url)`)
with Stripe Checkout embedded in our own pages. Backend, webhooks, DB, and the
reconciliation logic stay untouched — this is purely a payment-UI change.

**Status:** plan approved 2026-08-14. Not yet implemented.

---

## 1. Facts verified (Stripe docs, API 2026-07-29.dahlia)

- Server creates a Checkout Session with a UI mode that returns a `client_secret`:
  - `ui_mode: 'form'` — embedded checkout form (current recommended embedded approach)
  - `ui_mode: 'elements'` — Express Checkout Element
  - (`ui_mode: 'embedded'` is the older embedded Checkout variant — check what the
    installed SDK/version supports before choosing; the Stripe docs describe the
    form/elements modes as current.)
- The client mounts the form with the `client_secret` via `@stripe/react-stripe-js`
  (exact provider name depends on the installed v5.6.1 exports:
  `CheckoutFormProvider` / `EmbeddedCheckoutProvider` / `CheckoutProvider` — verify
  at session start; the old stub used `@stripe/react-stripe-js/checkout`).
- Stripe.js must be loaded from `js.stripe.com` (via `loadStripe`) — never bundled.
- `return_url` is still required: after payment the customer is redirected there.
  On that page we retrieve the session by ID and verify server-side — our
  `/payment-success` + `verify-payment` already do exactly this. No changes needed.
- Embedded UI on OUR domain means wallet methods (Apple Pay / Google Pay) require
  **domain registration** (PaymentMethodDomain API / Dashboard). Card-only works
  without it; verify what works on localhost in test mode.
- `integration_identifier` + "no `payment_method_types`" rules still apply.

## 2. Changes

### A. `create-checkout` edge function (supabase/functions/create-checkout)
- Add `ui_mode` to session creation (decide form vs elements during session after
  checking the installed client lib exports; `stripe docs api checkout/sessions/create`
  for the exact parameter on our SDK).
- Add `return_url: ${siteUrl()}/payment-success?session_id={CHECKOUT_SESSION_ID}`
  (same URL we already use for success_url).
- Keep returning `{ url }` for now AND add `{ client_secret, session_id }` so the
  frontend can switch progressively.

### B. Frontend Stripe plumbing
- `VITE_STRIPE_PUBLISHABLE_KEY` becomes actively used (already in .env).
- New module `src/lib/stripe.ts`: lazy `loadStripe(pk)` promise singleton.

### C. Membership checkout page (`src/pages/MembershipCheckout.tsx`)
- Replace the "Continue to payment" redirect with:
  1. POST `/membership/checkout` → `{ client_secret }`
  2. Render the embedded checkout component (provider + form) in the card area
  3. On completion → navigate to `/payment-success?session_id=...` (existing page
     verifies + reconciles)
- Keep plan picker + cancel flow exactly as today.

### D. Event payments
- After registration with `payment_required`, instead of redirecting away:
  - Recommended: dedicated route `/events/:eventId/payment?registration_id=...`
    mounting the same embedded component (cleaner than nesting inside the modal,
    plays well with the membership gate).
  - Decide at session start; alternative is embedding inside `ExpandedCardModal`.
- On completion → `/payment-success` (kind-aware messaging already handles events).

### E. Cleanup
- Delete `src/pages/StripeCheckout.tsx` (legacy stub) — check with user first, they
  previously skipped its removal.
- Remove the `window.location.assign(url)` paths once embedded is stable.

## 3. Go-live checklist (domain + security)

- [ ] Register the production domain for Apple Pay / Google Pay (PaymentMethodDomain
      API or Dashboard) once a real domain exists (currently localhost:3000 only).
- [ ] CSP headers on the production host:
      - `script-src` → `https://js.stripe.com`
      - `frame-src` → `https://js.stripe.com https://hooks.stripe.com`
      - `connect-src` → `https://api.stripe.com`
- [ ] Test cards: 4242… success, 4000002500003155 (3DS), 4000000000000002 (decline).
- [ ] Wallet visibility test on real devices (Apple Pay needs a wallet card;
      Google Pay testable in test mode).
- [ ] Swish still works (mobile redirect / QR — verify embedded + redirect interplay).

## 4. Regression notes

- Webhook (`payment-webhook`), `verify-payment` reconciliation, RLS, triggers,
  `payment_required` logic, gate, cancel flow: **no changes**.
- Fallback path: keep the hosted URL in `create-checkout` response during the
  transition so we can revert per-page with a one-line change if needed.

## 5. Session order

1. Verify installed `@stripe/react-stripe-js@5.6.1` exports + choose `ui_mode`
   (use `stripe docs api checkout/sessions/create` + package d.ts).
2. A: server changes → deploy → smoke test (client_secret present).
3. B–C: membership checkout embedded end-to-end (signup → confirm → pay → success).
4. D: event payment embed.
5. E: cleanup + full regression (hosted path, webhook, cancel, gate, member pricing).
