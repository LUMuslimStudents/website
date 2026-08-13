import { supabase } from ']/client';

// ── Types ───────────────────────────────────────────────────────────────────

export type MembershipPlan = 'single_term' | 'two_term';

export type MembershipStatus = {
  loggedIn: boolean;
  term: string | null;
  membershipOpen: boolean;
  priceSingleTerm: number;
  priceTwoTerm: number;
  paid: boolean;
  paidPlan: MembershipPlan | null;
  paidAmount: number | null;
  paidAt: string | null;
};

// ── Membership status (for the login gate + membership page) ────────────────

export const getMembershipStatus = async (): Promise<MembershipStatus> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: options } = await supabase
    .from('admin_options')
    .select('*')
    .eq('is_current', true)
    .maybeSingle();

  const status: MembershipStatus = {
    loggedIn: Boolean(user && !user.is_anonymous),
    term: (options?.term as string) ?? null,
    membershipOpen: Boolean(options?.membership_open),
    priceSingleTerm: (options?.price_single_term as number) ?? 150,
    priceTwoTerm: (options?.price_discounted_two_term as number) ?? 300,
    paid: false,
    paidPlan: null,
    paidAmount: null,
    paidAt: null,
  };

  if (!user || user.is_anonymous || !options) return status;

  const { data: payments } = await supabase
    .from('membership_payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('term', options.term as string)
    .eq('payment_status', 'paid');

  const paidRow = payments?.[0];
  if (paidRow) {
    status.paid = true;
    status.paidPlan = paidRow.plan as MembershipPlan;
    status.paidAmount = paidRow.amount as number;
    status.paidAt = (paidRow.paid_at as string | null) ?? null;
  }

  return status;
};

// ── Checkout creation (redirects to Stripe-hosted Checkout) ─────────────────

export const createMembershipCheckout = async (
  plan: MembershipPlan,
): Promise<{ url: string }> => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { kind: 'membership', plan },
  });
  if (error) throw new Error(error.message);
  return data as { url: string };
};

// ── Cancel membership signup (checkout page "Cancel" button) ────────────────

/**
 * Deletes the user's account completely. The edge function refuses if any
 * payment already completed (re-checks Stripe server-side first).
 */
export const cancelMembership = async (): Promise<{ message: string }> => {
  const { data, error } = await supabase.functions.invoke('cancel-membership', {
    body: {},
  });
  if (error) {
    // FunctionsHttpError hides the function's JSON body behind a generic
    // message — dig the real error out of the response context.
    let message = error.message;
    const context = (error as { context?: Response })?.context;
    if (context && typeof context.json === 'function') {
      try {
        const body = (await context.json()) as { error?: string };
        if (body?.error) message = body.error;
      } catch {
        // keep the generic message
      }
    }
    throw new Error(message);
  }
  return data as { message: string };
};

export const createEventCheckout = async (
  registrationId: string,
): Promise<{ url: string }> => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { kind: 'event', registration_id: registrationId },
  });
  if (error) throw new Error(error.message);
  return data as { url: string };
};

// ── Payment verification (success page) ─────────────────────────────────────

export const verifyPayment = async (  sessionId: string,
): Promise<{ paid: boolean; kind: string | null; payment_status: string }> => {
  // POST (not GET) — supabase-js sends GET bodies as request bodies, which
  // Firefox rejects ("Request with GET/HEAD method cannot have body").
  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: { session_id: sessionId },
  });
  if (error) throw new Error(error.message);
  return data as { paid: boolean; kind: string | null; payment_status: string };
};
