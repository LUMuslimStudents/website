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
        'id, user_id, term, plan, amount, payment_status, paid_at, created_at, user:users(first_name, last_name, phone_number)',
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
        'id, event_id, user_id, status, quoted_price, payment_required, payment_status, payment_completed_at, submitted_at, updated_at, event:events_info(id, term, title, date), user:users(first_name, last_name, phone_number), profile:event_registration_profiles(first_name, last_name, email, phone_number)',
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
      email: emailById.get(row.user_id) ?? null,
    }));

    const registrations = (registrationResult.data ?? []).map((row) => ({
      ...row,
      email: row.profile?.email ?? emailById.get(row.user_id) ?? null,
    }));

    // ── Unified income list: one row per actual payment ─────────────────────
    // Unpaid rows are excluded (no payment exists yet); failed attempts are
    // kept so the treasurer sees them.
    const income = [
      ...memberships
        .filter((payment) => payment.payment_status !== 'unpaid')
        .map((payment) => ({
          id: `membership:${payment.id}`,
          kind: 'membership',
          term: payment.term,
          amount: payment.amount,
          payment_status: payment.payment_status,
          paid_at: payment.paid_at ?? payment.created_at,
          payer_name: payment.user
            ? `${payment.user.first_name} ${payment.user.last_name}`.trim()
            : 'Unknown member',
          payer_email: payment.email,
          payer_phone: payment.user?.phone_number ?? null,
          member: true,
          plan: payment.plan,
          event_title: null,
          event_date: null,
        })),
      ...registrations
        .filter(
          (registration) =>
            registration.payment_required &&
            registration.payment_status !== 'unpaid',
        )
        .map((registration) => ({
          id: `registration:${registration.id}`,
          kind: 'event',
          term: registration.event?.term ?? null,
          amount: registration.quoted_price,
          payment_status: registration.payment_status,
          paid_at: registration.payment_completed_at ?? registration.submitted_at,
          payer_name: registration.user
            ? `${registration.user.first_name} ${registration.user.last_name}`.trim()
            : registration.profile
              ? `${registration.profile.first_name} ${registration.profile.last_name}`.trim()
              : 'Guest',
          payer_email: registration.email,
          payer_phone:
            registration.user?.phone_number ??
            registration.profile?.phone_number ??
            null,
          member: Boolean(registration.user_id),
          plan: null,
          event_title: registration.event?.title ?? null,
          event_date: registration.event?.date ?? null,
        })),
    ];

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
