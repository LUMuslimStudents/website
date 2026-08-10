import { supabase } from ']/client';

export type AdminOptions = {
  term: string;
  price_single_term: number;
  price_discounted_two_term: number;
  membership_open: boolean;
  is_current: boolean;
};

// ── Get all admin options ───────────────────────────────────────────────────

export const getAdminOptions = async (): Promise<AdminOptions[]> => {
  const { data, error } = await supabase
    .from('admin_options')
    .select('*')
    .order('term', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as AdminOptions[]) ?? [];
};

// ── Get the current term's options ──────────────────────────────────────────

export const getCurrentAdminOptions = async (): Promise<AdminOptions | null> => {
  const { data, error } = await supabase
    .from('admin_options')
    .select('*')
    .eq('is_current', true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminOptions | null;
};

// ── Upsert admin options for a term ─────────────────────────────────────────

export const upsertAdminOptions = async (
  input: AdminOptions,
): Promise<AdminOptions> => {
  const { data, error } = await supabase
    .from('admin_options')
    .upsert(
      {
        term: input.term,
        price_single_term: input.price_single_term,
        price_discounted_two_term: input.price_discounted_two_term,
        membership_open: input.membership_open,
        is_current: input.is_current,
      },
      { onConflict: 'term' },
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminOptions;
};

