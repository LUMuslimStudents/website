// admin-list-users — server-side user listing for the admin dashboard.
// Enriches public.users rows with emails from auth.users (service role) and
// membership payment status. Requires the caller to be an admin.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  adminClient,
  corsHeaders,
  jsonResponse,
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
      data: { user: caller },
      error: authError,
    } = await userClient(req).auth.getUser();
    if (authError || !caller) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { data: callerRow } = await adminClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();
    if (callerRow?.role !== 'admin') {
      return jsonResponse({ error: 'Access denied. Admin role required.' }, 403);
    }

    // ── Emails from auth.users (paginated) ────────────────────────────────
    const emailById = new Map<string, string>();
    const perPage = 1000;
    for (let page = 1; ; page += 1) {
      const { data: authUsers, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      for (const authUser of authUsers?.users ?? []) {
        if (authUser.id && authUser.email) {
          emailById.set(authUser.id, authUser.email);
        }
      }
      if (!authUsers || authUsers.users.length < perPage) break;
    }

    // ── Public users + membership payments ────────────────────────────────
    const { data: options } = await adminClient
      .from('admin_options')
      .select('term')
      .eq('is_current', true)
      .maybeSingle();
    const currentTerm = (options?.term as string | undefined) ?? null;

    const { data: users, error } = await adminClient
      .from('users')
      .select(
        '*, membership_payments(id, term, plan, transaction:transactions(amount, payment_status, paid_at))',
      );
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    const merged = (users ?? []).map((row: Record<string, unknown>) => {
      const rawPayments = (row.membership_payments ?? []) as Array<{
        id: string;
        term: string;
        plan: string;
        transaction: {
          amount: number;
          payment_status: string;
          paid_at: string | null;
        } | null;
      }>;
      const payments = rawPayments.map((payment) => ({
        id: payment.id,
        term: payment.term,
        plan: payment.plan,
        amount: payment.transaction?.amount ?? 0,
        payment_status: payment.transaction?.payment_status ?? 'unpaid',
        paid_at: payment.transaction?.paid_at ?? null,
      }));
      const currentPaid = payments.find(
        (payment) =>
          payment.term === currentTerm && payment.payment_status === 'paid',
      );
      const anyPaid = payments.find(
        (payment) => payment.payment_status === 'paid',
      );

      return {
        ...row,
        email: emailById.get(row.id as string) ?? null,
        membership_payments: payments,
        membership_status: currentPaid ? 'paid' : 'unpaid',
        membership_plan: currentPaid?.plan ?? anyPaid?.plan ?? null,
        membership_paid_at: currentPaid?.paid_at ?? null,
      };
    });

    return jsonResponse({ users: merged });
  } catch (error) {
    console.error('admin-list-users error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
