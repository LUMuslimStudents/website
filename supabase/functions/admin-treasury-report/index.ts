// admin-treasury-report — income summary for the treasurer view.
// Returns membership payments and event registrations (joined with user
// names, profiles, and events) plus the distinct term list and the current
// term. Pass { term: "VT26" } to filter to one term; omit for all terms.
// Requires the caller to be an admin.
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

    let body: { term?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const term = typeof body?.term === 'string' && body.term ? body.term : null;

    // ── Emails from auth.users (paginated) ──────────────────────────────────
    // public.users has phone numbers but no emails.
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

    // ── Distinct terms + current term ───────────────────────────────────────
    const [optionsResult, membershipTermsResult, eventTermsResult] =
      await Promise.all([
        adminClient
          .from('admin_options')
          .select('term')
          .eq('is_current', true)
          .maybeSingle(),
        adminClient.from('membership_payments').select('term'),
        adminClient.from('events_info').select('term'),
      ]);

    const currentTerm = (optionsResult.data?.term as string | undefined) ?? null;
    const terms = Array.from(
      new Set(
        [
          ...(membershipTermsResult.data ?? []).map((row) => row.term as string),
          ...(eventTermsResult.data ?? []).map((row) => row.term as string),
        ].filter((value): value is string => Boolean(value)),
      ),
    ).sort();

    // ── Membership payments (joined with the member's identity) ─────────────
    let membershipQuery = adminClient
      .from('membership_payments')
      .select(
        'id, user_id, term, plan, created_at, transaction:transactions(amount, payment_status, paid_at), user:users(first_name, last_name, phone_number)',
      );
    if (term) {
      membershipQuery = membershipQuery.eq('term', term);
    }
    const membershipResult = await membershipQuery.order('created_at', {
      ascending: false,
    });

    if (membershipResult.error) {
      return jsonResponse({ error: membershipResult.error.message }, 500);
    }

    // ── Event registrations (joined with event + participant identity) ──────
    let registrationQuery = adminClient
      .from('event_registrations')
      .select(
        'id, event_id, user_id, status, quoted_price, payment_required, transaction:transactions(amount, payment_status, paid_at), submitted_at, updated_at, event:events_info(id, term, title, date), user:users(first_name, last_name, phone_number), profile:event_registration_profiles(first_name, last_name, email, phone_number)',
      );

    if (term) {
      // Filter registrations to events of this term via the to-one event join.
      registrationQuery = registrationQuery.eq('event.term', term);
    }
    const registrationResult = await registrationQuery.order('submitted_at', {
      ascending: false,
    });

    if (registrationResult.error) {
      return jsonResponse({ error: registrationResult.error.message }, 500);
    }

    // ── Merge emails (auth.users) into both row sets ────────────────────────
    const memberships = (membershipResult.data ?? []).map((row) => ({
      ...row,
      amount: row.transaction?.amount ?? 0,
      payment_status: row.transaction?.payment_status ?? 'unpaid',
      paid_at: row.transaction?.paid_at ?? null,
      email: emailById.get(row.user_id) ?? null,
    }));

    const registrations = (registrationResult.data ?? []).map((row) => ({
      ...row,
      payment_status: row.transaction?.payment_status ?? 'unpaid',
      payment_completed_at: row.transaction?.paid_at ?? null,
      email: row.profile?.email ?? emailById.get(row.user_id) ?? null,
    }));

    // ── Unified income list: source the ledger directly from transactions ────
    // One row per payment. Unpaid (pending/abandoned) transactions are
    // excluded; failed attempts are kept so the treasurer sees them.
    let txQuery = adminClient
      .from('transactions')
      .select('*, user:users(first_name, last_name, phone_number)');
    if (term) {
      txQuery = txQuery.eq('term', term);
    }
    const txResult = await txQuery.order('created_at', { ascending: false });
    if (txResult.error) {
      return jsonResponse({ error: txResult.error.message }, 500);
    }
    const transactions = txResult.data ?? [];

    // Source-row context: event title/date + guest profile (events) and plan
    // (memberships), keyed by transaction_id so each transaction is enriched.
    const eventCtx = new Map<string, any>();
    const membershipCtx = new Map<string, any>();
    const txIds = transactions.map((t) => t.id);
    if (txIds.length > 0) {
      const { data: eventRows } = await adminClient
        .from('event_registrations')
        .select(
          'transaction_id, event:events_info(id, term, title, date), profile:event_registration_profiles(first_name, last_name, email, phone_number)',
        )
        .in('transaction_id', txIds);
      for (const row of eventRows ?? []) {
        if (row.transaction_id) eventCtx.set(row.transaction_id, row);
      }

      const { data: membershipRows } = await adminClient
        .from('membership_payments')
        .select('transaction_id, plan')
        .in('transaction_id', txIds);
      for (const row of membershipRows ?? []) {
        if (row.transaction_id) membershipCtx.set(row.transaction_id, row);
      }
    }

    const income = transactions
      .filter((t) => t.payment_status !== 'unpaid')
      .map((t) => {
        const source = t.source;
        const ev = eventCtx.get(t.id);
        const mp = membershipCtx.get(t.id);

        let payer_name = 'Unknown';
        let payer_email: string | null = null;
        let payer_phone: string | null = null;
        let plan: string | null = null;
        let event_title: string | null = null;
        let event_date: string | null = null;

        if (source === 'membership') {
          payer_name = t.user
            ? `${t.user.first_name} ${t.user.last_name}`.trim()
            : 'Unknown member';
          payer_email = emailById.get(t.user_id) ?? null;
          payer_phone = t.user?.phone_number ?? null;
          plan = mp?.plan ?? null;
        } else if (source === 'event') {
          const profileName = ev?.profile
            ? `${ev.profile.first_name} ${ev.profile.last_name}`.trim()
            : '';
          payer_name =
            profileName ||
            (t.user
              ? `${t.user.first_name} ${t.user.last_name}`.trim()
              : 'Guest');
          payer_email = ev?.profile?.email ?? emailById.get(t.user_id) ?? null;
          payer_phone =
            t.user?.phone_number ?? ev?.profile?.phone_number ?? null;
          event_title = ev?.event?.title ?? null;
          event_date = ev?.event?.date ?? null;
        } else {
          // donation (no source table yet)
          payer_name = t.user
            ? `${t.user.first_name} ${t.user.last_name}`.trim()
            : 'Donor';
          payer_email = emailById.get(t.user_id) ?? null;
          payer_phone = t.user?.phone_number ?? null;
        }

        return {
          id: t.id,
          source,
          term: t.term,
          amount: t.amount,
          currency: t.currency,
          payment_status: t.payment_status,
          paid_at: t.paid_at ?? t.created_at,
          created_at: t.created_at,
          payer_name,
          payer_email,
          payer_phone,
          member: Boolean(t.user_id),
          plan,
          event_title,
          event_date,
        };
      });

    return jsonResponse({
      terms,
      current_term: currentTerm,
      memberships,
      registrations,
      income,
    });
  } catch (error) {
    console.error('admin-treasury-report error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
