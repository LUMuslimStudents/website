// create-checkout — creates a Stripe Checkout Session for a membership payment
// or an event registration payment. Prices are always resolved server-side from
// the database; the client never sends an amount.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  adminClient,
  corsHeaders,
  jsonResponse,
  randomSuffix,
  siteUrl,
  stripe,
  userClient,
} from '../_shared/stripe-payments.ts';

type CheckoutRequest =
  | { kind: 'membership'; plan?: 'single_term' | 'two_term' }
  | { kind: 'event'; registration_id?: string };

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
    const {
      data: { user },
      error: authError,
    } = await userClient(req).auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const successUrl = `${siteUrl()}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const sessionBase = {
      mode: 'payment' as const,
      customer_email: user.email ?? undefined,
      success_url: successUrl,
    };

    // ── Membership payment ──────────────────────────────────────────────────
    if (body.kind === 'membership') {
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
      const { data: paidRow } = await adminClient
        .from('membership_payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('term', options.term)
        .eq('payment_status', 'paid')
        .maybeSingle();
      if (paidRow) {
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

      // Reuse an existing unpaid row for the same term/plan, else insert.
      const { data: existingRow } = await adminClient
        .from('membership_payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('term', options.term)
        .eq('plan', plan)
        .eq('payment_status', 'unpaid')
        .maybeSingle();

      if (existingRow) {
        const { error: updErr } = await adminClient
          .from('membership_payments')
          .update({ stripe_session_id: session.id, amount: amountSek })
          .eq('id', existingRow.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await adminClient
          .from('membership_payments')
          .insert({
            user_id: user.id,
            term: options.term,
            plan,
            amount: amountSek,
            stripe_session_id: session.id,
          });
        if (insErr) throw insErr;
      }

      return jsonResponse({ url: session.url });
    }

    // ── Event registration payment ──────────────────────────────────────────
    if (body.kind === 'event') {
      const registrationId = body.registration_id;
      if (!registrationId) {
        return jsonResponse({ error: 'registration_id is required' }, 400);
      }

      const { data: registration, error: regError } = await adminClient
        .from('event_registrations')
        .select('id, event_id, user_id, quoted_price, payment_required, payment_status')
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
      if (registration.payment_status === 'paid') {
        return jsonResponse({ error: 'Registration is already paid' }, 409);
      }

      const { data: event, error: eventError } = await adminClient
        .from('events_info')
        .select('title')
        .eq('id', registration.event_id)
        .maybeSingle();
      if (eventError) throw eventError;

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

      const { error: updErr } = await adminClient
        .from('event_registrations')
        .update({ stripe_session_id: session.id })
        .eq('id', registrationId);
      if (updErr) throw updErr;

      return jsonResponse({ url: session.url });
    }

    return jsonResponse({ error: "kind must be 'membership' or 'event'" }, 400);
  } catch (error) {
    console.error('create-checkout error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
