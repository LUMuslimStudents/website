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

    // Donations may be anonymous, so auth is optional here. Ownership is
    // enforced below for membership/event payments only.
    const {
      data: { user },
      error: authError,
    } = await userClient(req).auth.getUser();

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const kind = session.metadata?.kind;

    if (session.payment_status !== 'paid') {
      return jsonResponse({
        paid: false,
        kind: kind ?? null,
        payment_status: session.payment_status,
      });
    }

    // Reconcile webhook lag: Stripe says paid → mark the transaction paid now.
    await reconcilePaymentRow(session, 'paid');

    const { data: tx } = await adminClient
      .from('transactions')
      .select('user_id, source, payment_status')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (!tx) {
      return jsonResponse({ paid: false, kind: null, payment_status: 'unpaid' });
    }

    if (tx.source !== 'donation') {
      if (authError || !user) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
      if (tx.user_id !== user.id) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
    }

    return jsonResponse({
      paid: tx.payment_status === 'paid',
      kind: tx.source,
      payment_status: tx.payment_status,
    });
  } catch (error) {
    console.error('verify-payment error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
