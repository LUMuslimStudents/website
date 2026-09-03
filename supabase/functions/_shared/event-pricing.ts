// Shared server-side event price resolution.
//
// The price tier is ALWAYS derived here from the event + membership + alumnus
// status — never from client input. Used by `register-event` (registration
// creation) and `create-checkout` (Stripe amount) so both legs of a payment
// agree on the authoritative amount.

export type EventPricing = {
  price_member: number;
  price_alumnus: number;
  price_nonmember: number;
};

// Does the user have a paid membership for the current term? "Member" means a
// paid `transactions` row with source='membership' for the current term —
// simply having an account is NOT enough.
export const hasPaidMembership = async (
  client: any,
  userId: string,
): Promise<boolean> => {
  const { data: options } = await client
    .from('admin_options')
    .select('term')
    .eq('is_current', true)
    .maybeSingle();

  if (!options) return false;

  const { data: paidTx } = await client
    .from('transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('term', options.term as string)
    .eq('source', 'membership')
    .eq('payment_status', 'paid')
    .maybeSingle();

  return Boolean(paidTx);
};

// Derive the price for a registration, mirroring the original tier logic:
// paid member → member price, alumnus → alumnus price, else non-member price.
export const eventPrice = (
  event: EventPricing,
  paidMembership: boolean,
  isAlumnus: boolean,
): number =>
  paidMembership
    ? event.price_member
    : isAlumnus
      ? event.price_alumnus
      : event.price_nonmember;
