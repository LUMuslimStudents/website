// verify-payment — called by the payment-success page. Confirms (server-side)
// that a Checkout Session is paid AND that the payment belongs to the calling
// user. The browser's word is never trusted. If Stripe says "paid" but the
// webhook hasn't landed yet, the row is reconciled here — so the success page
// works even on the very first load after the redirect.
//
// NOTE: accepts POST (not GET) — supabase-js cannot send a body on GET
// requests (Firefox rejects fetch with a GET body).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  adminClient,
  corsHeaders,
  jsonResponse,
  reconcilePaymentRow,
  stripe,
  userClient,
} from '../_shared/stripe-payments.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { session_id: sessionId } = (await req.json()) as {
      session_id?: string;
    };
    if (!sessionId) {
      return jsonResponse({ error: 'session_id is required' }, 400);
    }

    const {
      data: { user },
      error: authError,
    } = await userClient(req).auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const kind = session.metadata?.kind;

    if (session.payment_status !== 'paid') {
      return jsonResponse({
        paid: false,
        kind: kind ?? null,
        payment_status: session.payment_status,
      });
    }

    if (kind === 'membership') {
      const isOwner = session.metadata?.user_id === user.id;
      if (!isOwner) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      // Reconcile webhook lag: Stripe says paid → mark the row paid now.
      await reconcilePaymentRow('membership_payments', session, 'paid');
      const { data: row } = await adminClient
        .from('membership_payments')
        .select('payment_status')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();
      return jsonResponse({
        paid: row?.payment_status === 'paid',
        kind: 'membership',
        payment_status: row?.payment_status ?? 'unpaid',
      });
    }

    if (kind === 'event') {
      const registrationId = session.metadata?.registration_id;
      const { data: registration } = await adminClient
        .from('event_registrations')
        .select('user_id, payment_status')
        .eq('id', registrationId ?? '')
        .maybeSingle();

      const isOwner = registration?.user_id === user.id;
      if (!isOwner) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      // Reconcile webhook lag: Stripe says paid → mark the row paid now.
      await reconcilePaymentRow('event_registrations', session, 'paid');
      const { data: row } = await adminClient
        .from('event_registrations')
        .select('payment_status')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();
      return jsonResponse({
        paid: row?.payment_status === 'paid',
        kind: 'event',
        payment_status: row?.payment_status ?? 'unpaid',
      });
    }

    return jsonResponse({ error: 'Unknown session kind' }, 400);
  } catch (error) {
    console.error('verify-payment error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
