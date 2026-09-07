// create-checkout — creates a Stripe Checkout Session for a membership payment
// or an event registration payment. Prices are always resolved server-side from
// the database; the client never sends an amount.
// NOTE: verify_jwt is OFF (deploy flag) — donations allow anonymous checkouts.
// Auth is enforced in-function below for membership/event payments only.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  adminClient,
  corsHeaders,
  jsonResponse,
  randomSuffix,
  reconcilePaymentRow,
  siteUrl,
  stripe,
  userClient,
} from '../_shared/stripe-payments.ts';

type CheckoutRequest =
  | { kind: 'membership'; plan?: 'single_term' | 'two_term' }
  | { kind: 'event'; registration_id?: string }
  | { kind: 'donation'; amount?: number };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as CheckoutRequest;

    // ── Auth ────────────────────────────────────────────────────────────────
    // Membership + event require a signed-in user; donations allow anonymous.
    const {
      data: { user },
      error: authError,
    } = await userClient(req).auth.getUser();

    const successUrl = `${siteUrl()}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const sessionBase = {
      mode: 'payment' as const,
      customer_email: user?.email ?? undefined,
      success_url: successUrl,
    };

    // ── Membership payment ──────────────────────────────────────────────────
    if (body.kind === 'membership') {
      if (authError || !user) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
      const plan = body.plan === 'two_term' ? 'two_term' : 'single_term';

      const { data: options, error: optsError } = await adminClient
        .from('admin_options')
        .select('*')
        .eq('is_current', true)
        .maybeSingle();
      if (optsError) throw optsError;
      if (!options) {
        return jsonResponse({ error: 'Membership is not configured' }, 503);
      }
      if (!options.membership_open) {
        return jsonResponse({ error: 'Membership signup is currently closed' }, 403);
      }

      const amountSek =
        plan === 'two_term'
          ? options.price_discounted_two_term
          : options.price_single_term;

      // Already paid for the current term?
      const { data: paidTx } = await adminClient
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('term', options.term)
        .eq('source', 'membership')
        .eq('payment_status', 'paid')
        .maybeSingle();
      if (paidTx) {
        return jsonResponse({ error: 'Membership already paid for this term' }, 409);
      }

      const session = await stripe().checkout.sessions.create({
        ...sessionBase,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'sek',
              unit_amount: amountSek * 100, // Stripe amounts are in öre
              product_data: {
                name:
                  plan === 'two_term'
                    ? 'LUMS membership — two terms'
                    : 'LUMS membership — single term',
              },
            },
          },
        ],
        metadata: {
          kind: 'membership',
          user_id: user.id,
          term: options.term,
          plan,
        },
        cancel_url: `${siteUrl()}/membership`,
        integration_identifier: `lums-membership-${randomSuffix()}`,
      });

      // Reuse an existing membership record for the same term/plan, else
      // insert. Its payment lives on a transactions row (1:1 via
      // transaction_id), which is also reused when still unpaid.
      const { data: existingMp } = await adminClient
        .from('membership_payments')
        .select('id, transaction_id')
        .eq('user_id', user.id)
        .eq('term', options.term)
        .eq('plan', plan)
        .maybeSingle();

      let txnId: string | null = existingMp?.transaction_id ?? null;
      if (txnId) {
        const { error: txnErr } = await adminClient
          .from('transactions')
          .update({
            amount: amountSek,
            stripe_session_id: session.id,
            payment_status: 'unpaid',
            paid_at: null,
          })
          .eq('id', txnId);
        if (txnErr) throw txnErr;
      } else {
        txnId = crypto.randomUUID();
        const { error: txnErr } = await adminClient
          .from('transactions')
          .insert({
            id: txnId,
            user_id: user.id,
            source: 'membership',
            term: options.term,
            amount: amountSek,
            currency: 'sek',
            stripe_session_id: session.id,
          });
        if (txnErr) throw txnErr;
      }

      if (existingMp) {
        const { error: mpErr } = await adminClient
          .from('membership_payments')
          .update({ transaction_id: txnId })
          .eq('id', existingMp.id);
        if (mpErr) throw mpErr;
      } else {
        const { error: mpErr } = await adminClient
          .from('membership_payments')
          .insert({
            user_id: user.id,
            term: options.term,
            plan,
            transaction_id: txnId,
          });
        if (mpErr) throw mpErr;
      }

      return jsonResponse({ url: session.url });
    }

    // ── Event registration payment ──────────────────────────────────────────
    if (body.kind === 'event') {
      if (authError || !user) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
      const registrationId = body.registration_id;
      if (!registrationId) {
        return jsonResponse({ error: 'registration_id is required' }, 400);
      }

      const { data: registration, error: regError } = await adminClient
        .from('event_registrations')
        .select('id, event_id, user_id, quoted_price, payment_required, transaction_id, transaction:transactions(id, payment_status, stripe_session_id)')
        .eq('id', registrationId)
        .maybeSingle();
      if (regError) throw regError;
      if (!registration) {
        return jsonResponse({ error: 'Registration not found' }, 404);
      }
      if (registration.user_id !== user.id) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      if (!registration.payment_required) {
        return jsonResponse({ error: 'No payment required for this registration' }, 400);
      }
      if (registration.transaction?.payment_status === 'paid') {
        return jsonResponse({ error: 'Registration is already paid' }, 409);
      }

      const { data: event, error: eventError } = await adminClient
        .from('events_info')
        .select('term, title')
        .eq('id', registration.event_id)
        .maybeSingle();
      if (eventError) throw eventError;

      // A registration owns exactly ONE transaction (event_registrations.
      // transaction_id is unique). Never mint a second transaction for the
      // same registration: the first row the user pays must stay the
      // authoritative one and the registration must keep pointing at it.
      const existingTxnId = registration.transaction_id ?? null;
      const existingSessionId =
        registration.transaction?.stripe_session_id ?? null;

      // If a Checkout Session is already linked, reuse it while it is still
      // open so duplicate/resume calls stay idempotent and never overwrite
      // the stripe_session_id the webhook needs to reconcile the real payment.
      if (existingSessionId) {
        try {
          const existing = await stripe().checkout.sessions.retrieve(
            existingSessionId,
          );
          if (existing.payment_status === 'paid') {
            await reconcilePaymentRow(existing, 'paid');
            return jsonResponse({ error: 'Registration is already paid' }, 409);
          }
          if (existing.status === 'open' && existing.url) {
            return jsonResponse({ url: existing.url });
          }
        } catch (retrieveErr) {
          // A stale/unreadable session is not fatal — fall through and mint a
          // fresh session, reusing the existing transaction row.
          console.warn('create-checkout: session re-check failed', retrieveErr);
        }
        // Expired/complete → fall through and mint a fresh session below,
        // reusing the existing transaction row rather than inserting a new one.
      }

      const session = await stripe().checkout.sessions.create({
        ...sessionBase,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'sek',
              unit_amount: registration.quoted_price * 100,
              product_data: {
                name: event ? `${event.title} — registration` : 'Event registration',
              },
            },
          },
        ],
        metadata: {
          kind: 'event',
          registration_id: registrationId,
          event_id: String(registration.event_id),
          user_id: user.id,
        },
        cancel_url: `${siteUrl()}/events`,
        integration_identifier: `lums-event-${randomSuffix()}`,
      });

      if (existingTxnId) {
        // Guard against a concurrent webhook marking this row paid between our
        // read above and this write (TOCTOU). Never downgrade a paid row.
        const { error: txnErr } = await adminClient
          .from('transactions')
          .update({
            amount: registration.quoted_price,
            currency: 'sek',
            stripe_session_id: session.id,
            payment_status: 'unpaid',
            paid_at: null,
          })
          .eq('id', existingTxnId)
          .neq('payment_status', 'paid');
        if (txnErr) throw txnErr;

        // If the webhook won the race, the row is already paid — don't send the
        // user to a fresh checkout; tell them it's settled.
        const { data: recheck } = await adminClient
          .from('transactions')
          .select('payment_status')
          .eq('id', existingTxnId)
          .maybeSingle();
        if (recheck?.payment_status === 'paid') {
          return jsonResponse({ error: 'Registration is already paid' }, 409);
        }
      } else {
        const txnId = crypto.randomUUID();
        const { error: txnErr } = await adminClient
          .from('transactions')
          .insert({
            id: txnId,
            user_id: user.id,
            source: 'event',
            term: event?.term ?? '',
            amount: registration.quoted_price,
            currency: 'sek',
            stripe_session_id: session.id,
          });
        if (txnErr) throw txnErr;

        const { error: updErr } = await adminClient
          .from('event_registrations')
          .update({ transaction_id: txnId })
          .eq('id', registrationId);
        if (updErr) throw updErr;
      }

      return jsonResponse({ url: session.url });
    }

    // ── Donation payment ────────────────────────────────────────────────────
    if (body.kind === 'donation') {
      const amountSek = body.amount;
      if (
        typeof amountSek !== 'number' ||
        !Number.isInteger(amountSek) ||
        amountSek <= 0
      ) {
        return jsonResponse({ error: 'Invalid donation amount' }, 400);
      }
      // Stripe's minimum chargeable amount in SEK is 3.00.
      if (amountSek < 3) {
        return jsonResponse({ error: 'Donation must be at least 3 SEK' }, 400);
      }

      const { data: options } = await adminClient
        .from('admin_options')
        .select('term')
        .eq('is_current', true)
        .maybeSingle();
      const term = (options?.term as string | undefined) ?? '';

      const session = await stripe().checkout.sessions.create({
        ...sessionBase,
        success_url: `${siteUrl()}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'sek',
              unit_amount: amountSek * 100, // Stripe amounts are in öre
              product_data: {
                name: 'Donation to LUMS',
              },
            },
          },
        ],
        metadata: {
          kind: 'donation',
          user_id: user?.id ?? '',
          term,
        },
        cancel_url: `${siteUrl()}/donate`,
        integration_identifier: `lums-donation-${randomSuffix()}`,
      });

      const txnId = crypto.randomUUID();
      const { error: txnErr } = await adminClient
        .from('transactions')
        .insert({
          id: txnId,
          user_id: user?.id ?? null,
          source: 'donation',
          term,
          amount: amountSek,
          currency: 'sek',
          stripe_session_id: session.id,
        });
      if (txnErr) throw txnErr;

      return jsonResponse({ url: session.url });
    }

    return jsonResponse({ error: "kind must be 'membership', 'event' or 'donation'" }, 400);
  } catch (error) {
    console.error('create-checkout error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
