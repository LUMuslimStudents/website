// payment-webhook — Stripe webhook receiver. Verifies the signature, then
// marks memberships / event registrations as paid. Idempotent: rows already
// 'paid' are never downgraded, so Stripe's re-deliveries are no-ops.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  jsonResponse,
  reconcilePaymentRow,
  stripe,
  type StripeSession,
} from '../_shared/stripe-payments.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: 'Missing stripe-signature or STRIPE_WEBHOOK_SECRET' }),
      { status: 400 },
    );
  }

  let event;
  try {
    // Deno/worker runtime: WebCrypto is async-only, so the sync constructEvent
    // throws — constructEventAsync is required here.
    event = await stripe().webhooks.constructEventAsync(
      await req.text(),
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(
      JSON.stringify({ error: 'Signature verification failed' }),
      { status: 400 },
    );
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired') {
      const session = event.data.object as StripeSession;
      const desired = event.type === 'checkout.session.completed' ? 'paid' : 'failed';

      const result = await reconcilePaymentRow(session, desired);
      if (result === 'missing') {
        console.warn(`transaction row not found for session ${session.id}`);
      }
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('payment-webhook processing error:', error);
    // 500 → Stripe retries the delivery with backoff.
    return jsonResponse({ error: 'Processing failed' }, 500);
  }
});
