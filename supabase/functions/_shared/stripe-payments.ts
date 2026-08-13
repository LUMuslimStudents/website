// Shared helpers for the Stripe payment edge functions.
import Stripe from 'https://esm.sh/stripe@22.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Service-role client (bypasses RLS). Caller identity is always verified
// separately with auth.getUser() before any privileged work happens.
export const adminClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// User-scoped client: forwards the browser's Authorization header so that
// auth.getUser() reflects the calling user.
export const userClient = (req: Request) =>
  createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
    },
  );

let stripeInstance: Stripe | null = null;

export const stripe = () => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2026-07-29.dahlia',
    });
  }
  return stripeInstance;
};

// Site URL used for success_url / cancel_url.
// No production URL exists yet — local development runs on http://localhost:3000.
// Override via the SITE_URL secret once a real domain exists.
export const siteUrl = () =>
  (Deno.env.get('SITE_URL') ?? 'http://localhost:3000').replace(/\/+$/, '');

// 8 random lowercase letters for the integration_identifier suffix.
export const randomSuffix = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((byte) => String.fromCharCode(97 + (byte % 26)))
    .join('');

// ── Payment reconciliation ───────────────────────────────────────────────────
// Shared by payment-webhook and verify-payment. Marks a row paid/failed based
// on the Stripe session. Idempotent: already-paid rows are never downgraded.
// Amount + currency are validated before marking anything as paid.

export type StripeSession = {
  id: string;
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  metadata?: Record<string, string>;
};

export const reconcilePaymentRow = async (
  table: 'membership_payments' | 'event_registrations',
  session: StripeSession,
  desired: 'paid' | 'failed',
): Promise<'paid' | 'failed' | 'missing' | 'already_paid'> => {
  const amountCol = table === 'membership_payments' ? 'amount' : 'quoted_price';
  const paidAtCol = table === 'membership_payments' ? 'paid_at' : 'payment_completed_at';

  const { data: row } = await adminClient
    .from(table)
    .select(`id, ${amountCol}, payment_status`)
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  if (!row) return 'missing';
  if (row.payment_status === 'paid') return 'already_paid';

  let finalStatus: 'paid' | 'failed' = desired;
  if (desired === 'paid') {
    const amountMatches =
      session.amount_total === row[amountCol] * 100 && session.currency === 'sek';
    if (!amountMatches) finalStatus = 'failed';
  }

  const { error } = await adminClient
    .from(table)
    .update({
      payment_status: finalStatus,
      [paidAtCol]: finalStatus === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', row.id);
  if (error) throw error;

  return finalStatus;
};
