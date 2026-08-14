// cancel-event-registration — cancels a pending (unpaid) event registration
// from the expanded event card. Deletes the registration row; the profile and
// form-answer rows cascade with it. Any open Stripe Checkout Session is
// expired first so a stale payment tab cannot charge after cancellation.
// Refuses if the registration is already paid (refunds are handled manually
// via the Stripe dashboard).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  adminClient,
  corsHeaders,
  jsonResponse,
  reconcilePaymentRow,
  stripe,
  userClient,
} from '../_shared/stripe-payments.ts';

type CancelRequest = { registration_id?: string };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as CancelRequest;
    const registrationId = body.registration_id;
    if (!registrationId) {
      return jsonResponse({ error: 'registration_id is required' }, 400);
    }

    const {
      data: { user },
      error: authError,
    } = await userClient(req).auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { data: registration, error: regError } = await adminClient
      .from('event_registrations')
      .select('id, user_id, payment_status, stripe_session_id')
      .eq('id', registrationId)
      .maybeSingle();
    if (regError) throw regError;

    // Idempotent: already gone → treat as success.
    if (!registration) {
      return jsonResponse({ message: 'Registration cancelled.' });
    }

    if (registration.user_id !== user.id) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    if (registration.payment_status === 'paid') {
      return jsonResponse(
        {
          error:
            'This registration is already paid. Contact the treasurer to cancel and request a refund.',
        },
        409,
      );
    }

    // ── Expire any open Checkout Session (closes the pay-vs-cancel race) ────
    const sessionId = registration.stripe_session_id;
    if (sessionId) {
      try {
        await stripe().checkout.sessions.expire(sessionId);
      } catch (err) {
        // Expire fails when the session already completed — re-check and
        // reconcile so we never delete a registration that was paid.
        try {
          const session = await stripe().checkout.sessions.retrieve(sessionId);
          if (session.payment_status === 'paid') {
            await reconcilePaymentRow('event_registrations', session, 'paid');
            return jsonResponse(
              {
                error:
                  'Payment already completed — contact the treasurer to cancel and request a refund.',
              },
              409,
            );
          }
        } catch (retrieveErr) {
          console.warn(
            'cancel-event-registration: session re-check failed',
            retrieveErr,
          );
        }
      }
    }

    // ── Delete the row (profile + answers cascade) ──────────────────────────
    const { error: deleteError } = await adminClient
      .from('event_registrations')
      .delete()
      .eq('id', registrationId);
    if (deleteError) throw deleteError;

    return jsonResponse({ message: 'Registration cancelled.' });
  } catch (error) {
    console.error('cancel-event-registration error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
