// cancel-membership — called from the membership checkout page's "Cancel
// signup" button. Deletes the user's account completely so they can sign up
// again. Refuses deletion if a payment already completed (re-checks Stripe
// server-side to close the pay-vs-cancel race).
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
    const {
      data: { user },
      error: authError,
    } = await userClient(req).auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const uid = user.id;

    // ── Safety: refuse if any payment already completed ────────────────────
    const { data: payments } = await adminClient
      .from('membership_payments')
      .select('stripe_session_id, payment_status')
      .eq('user_id', uid);

    for (const row of payments ?? []) {
      if (!row.stripe_session_id) continue;
      try {
        const session = await stripe().checkout.sessions.retrieve(
          row.stripe_session_id,
        );
        if (session.payment_status === 'paid') {
          // Reconcile (webhook may not have landed) and refuse deletion.
          await reconcilePaymentRow('membership_payments', session, 'paid');
          return jsonResponse(
            { error: 'Payment already completed — your membership is active.' },
            409,
          );
        }
        // Expire the dangling unpaid session.
        await stripe().checkout.sessions.expire(row.stripe_session_id);
      } catch (err) {
        console.warn('cancel-membership: session handling failed', err);
      }
    }

    // ── Clean up rows referencing public.users (FKs) ───────────────────────
    // Registrations first (profiles + answers cascade with them).
    await adminClient.from('event_registrations').delete().eq('user_id', uid);
    await adminClient.from('membership_payments').delete().eq('user_id', uid);

    // ── Delete the auth user (cascades to public.users) ────────────────────
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(uid);
    if (deleteError) {
      console.error('cancel-membership: deleteUser failed', deleteError);
      return jsonResponse({ error: deleteError.message }, 500);
    }

    return jsonResponse({
      message: 'Signup cancelled. You can create a new account anytime.',
    });
  } catch (error) {
    console.error('cancel-membership error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
