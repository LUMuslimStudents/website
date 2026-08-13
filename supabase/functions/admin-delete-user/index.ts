// admin-delete-user — lets an admin delete a user completely (auth + all data).
// Browser clients can't call auth.admin directly (service role required), so
// this is the safe wrapper. Requires the CALLER to be an admin.
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

    const { user_id: targetUserId } = (await req.json()) as {
      user_id?: string;
    };
    if (!targetUserId) {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    // ── Caller must be an admin ────────────────────────────────────────────
    const { data: callerRow } = await adminClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();
    if (callerRow?.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    // Registrations first (profiles + answers cascade), then auth user
    // (cascades to public.users; membership_payments now cascades too).
    await adminClient
      .from('event_registrations')
      .delete()
      .eq('user_id', targetUserId);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      targetUserId,
    );
    if (deleteError) {
      console.error('admin-delete-user: deleteUser failed', deleteError);
      return jsonResponse({ error: deleteError.message }, 500);
    }

    return jsonResponse({ message: 'User deleted.' });
  } catch (error) {
    console.error('admin-delete-user error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
