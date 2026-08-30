// admin-get-user-registrations — per-user event registrations for the admin
// dashboard's user detail dialog. Returns the user's registrations joined
// with their events. Requires the caller to be an admin.
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

    let body: { user_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const userId = typeof body?.user_id === 'string' ? body.user_id : '';
    if (!userId) {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    const { data: registrations, error } = await adminClient
      .from('event_registrations')
      .select(
        'id, event_id, status, quoted_price, payment_required, transaction:transactions(payment_status, paid_at), submitted_at, updated_at, event:events_info(id, title, date, start_time, end_time, address)',
      )
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    const flattened = (registrations ?? []).map((row) => ({
      ...row,
      payment_status: row.transaction?.payment_status ?? 'unpaid',
      payment_completed_at: row.transaction?.paid_at ?? null,
    }));

    return jsonResponse({ registrations: flattened });
  } catch (error) {
    console.error('admin-get-user-registrations error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
