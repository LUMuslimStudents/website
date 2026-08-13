import { supabase } from ']/client';

// ── Login ───────────────────────────────────────────────────────────────────

/**
 * Authenticate with email + password.
 * Supabase manages the session automatically (httpOnly cookie / localStorage).
 */
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    // Supabase returns "Invalid login credentials" for wrong email OR password.
    // Keep the message generic so attackers can't enumerate emails.
    throw new Error(error.message);
  }

  return {
    user: data.user,
    session: data.session,
  };
};

// ── Current User ────────────────────────────────────────────────────────────

/**
 * Return the currently authenticated user with their `public.users` profile.
 * Returns `null` when no session exists.
 */
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // "Auth session missing" is expected when not logged in — return null
    if (/Auth session missing/i.test(error.message)) {
      return null;
    }
    throw new Error(error.message);
  }

  if (!user) return null;

  // Fetch profile from public.users for role, gender, etc.
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Merge auth user + profile. Fall back to user_metadata for fields
  // that haven't been synced to public.users yet.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  return {
    id: user.id,
    email: user.email,
    first_name:
      (profile?.first_name as string) || (meta.first_name as string) || '',
    last_name:
      (profile?.last_name as string) || (meta.last_name as string) || '',
    phone_number:
      (profile?.phone_number as string) || (meta.phone_number as string) || null,
    gender:
      (profile?.gender as string) || (meta.gender as string) || 'male',
    study_program:
      (profile?.study_program as string) || (meta.study_program as string) || '',
    role: (profile?.role as string) || 'user',
    term: (profile?.term as string) || (meta.term as string) || null,
    created_at:
      (profile?.created_at as string) || user.created_at || null,
  };
};

// ── Sign Out ────────────────────────────────────────────────────────────────

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  return { message: 'Signed out successfully' };
};

// ── Signup email confirmation (PKCE exchange) ──────────────────────────────

/**
 * Verify the signup confirmation link (token_hash from the email).
 * Establishes the user's session — after this the membership gate takes over
 * and redirects them to the payment page.
 */
export const verifySignupToken = async (tokenHash: string) => {
  if (!tokenHash) {
    throw new Error('Missing signup token.');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'signup',
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    message: 'Email confirmed. Complete your membership payment to continue.',
    user: data.user,
  };
};

// ── Password Reset (link-based) ─────────────────────────────────────────────

/**
 * Send a password-reset link to the user's email.
 *
 * `redirectTo` must be a URL on your site.
 * After clicking the link, the user lands on that page with `?token_hash=...&type=recovery`
 * in the URL — call `verifyResetToken` to complete the PKCE flow.
 */
export const requestPasswordReset = async (
  email: string,
  redirectTo: string,
) => {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo },
  );

  if (error) {
    throw new Error(error.message);
  }

  // Intentionally vague — don't reveal whether the email exists
  return {
    message:
      'If an account with that email exists, a password reset link has been sent.',
  };
};

/**
 * Verify the reset token from the email link (PKCE exchange).
 * On success the user is authenticated — call `updatePassword` next.
 */
export const verifyResetToken = async (token_hash: string, redirectTo: string) => {  if (!token_hash) {
    throw new Error('Missing reset token.');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type: 'recovery',
    options: { redirectTo },
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    message: 'Token verified. You can now set a new password.',
    user: data.user,
  };
};

/**
 * Set a new password for the currently authenticated user.
 * Must be called after `verifyResetToken` (which establishes the session).
 */
export const updatePassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new Error(error.message);
  }

  return {
    message: 'Password updated successfully! You can now log in with your new password.',
    user: data.user,
  };
};

// ── Admin ───────────────────────────────────────────────────────────────────

/**
 * List all users (with emails + membership payment status).
 * The heavy lifting happens in the admin-list-users edge function, which
 * verifies the caller's admin role SERVER-SIDE and enriches the rows with
 * emails from auth.users (emails don't exist in public.users).
 */
export const getUsers = async () => {
  // Quick client-side check for a friendlier error message.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Access denied. Not authenticated.');
  }

  const { data, error } = await supabase.functions.invoke('admin-list-users', {
    body: {},
  });

  if (error) {
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
    throw new Error(message || 'Access denied. Admin role required.');
  }

  return (data as { users?: unknown[] })?.users ?? [];
};
