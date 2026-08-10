import { supabase } from ']/client';

// ── Types ───────────────────────────────────────────────────────────────────

export type SignupInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  gender: 'male' | 'female';
  study_program: string;
  phone_number: string;
  term?: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetch the current term and check if membership is open.
 * Returns the current term string, or throws if membership is closed / no term set.
 */
const resolveCurrentTerm = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('admin_options')
    .select('term, membership_open')
    .eq('is_current', true)
    .maybeSingle();

  if (error) {
    throw new Error('Failed to load term settings. Please try again later.');
  }

  if (!data) {
    throw new Error('No active term configured. Please contact an administrator.');
  }

  if (!data.membership_open) {
    throw new Error('Membership registration is currently closed.');
  }

  return data.term;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const ensureRequiredFieldsPresent = (input: SignupInput) => {
  const required = [
    'first_name',
    'last_name',
    'email',
    'password',
    'gender',
    'study_program',
    'phone_number',
  ] as const;
  for (const field of required) {
    if (!input[field]) {
      throw new Error(`Missing required signup field: ${field}`);
    }
  }
};

/**
 * Validate Lund University email via the edge function.
 */
const validateLuEmail = async (email: string): Promise<boolean> => {
  // Primary: supabase-js function invocation
  try {
    const { data, error } = await supabase.functions.invoke('validate-lu-email', {
      body: { email },
    });
    if (error) throw error;
    return data?.isValid === true;
  } catch {
    // Fallback: direct HTTP POST
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    try {
      const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/validate-lu-email`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Edge function responded with ${res.status}: ${text}`);
      }
      const json = await res.json();
      return json?.isValid === true;
    } catch (fallbackErr) {
      console.error('validateLuEmail fallback error:', fallbackErr);
      throw new Error('Email validation failed. Please try again later.');
    }
  }
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Create a new account with email + password.
 *
 * Supabase sends a **confirmation link** to the user's email.
 * Profile fields (name, gender, etc.) are stored in `auth.users.raw_user_meta_data`.
 * The user must click the link to verify before they can log in.
 */
export const signup = async (input: SignupInput) => {
  ensureRequiredFieldsPresent(input);

  const email = normalizeEmail(input.email);

  const isValidLuEmail = await validateLuEmail(email);
  if (!isValidLuEmail) {
    throw new Error('Not an LU student email');
  }

  const term = input.term?.trim() || (await resolveCurrentTerm());

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        phone_number: input.phone_number.trim(),
        gender: input.gender,
        study_program: input.study_program.trim(),
        term,
      },
    },
  });

  if (error) {
    // Forward Supabase error (e.g., "User already registered")
    throw new Error(error.message);
  }

  // If identities is empty, Supabase treated this as a duplicate signup
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error('A user with this email already exists.');
  }

  return {
    message:
      'Account created! Please check your email and click the confirmation link to verify your account.',
    flow: 'link' as const,
    userId: data.user?.id ?? null,
  };
};
