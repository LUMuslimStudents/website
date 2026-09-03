export type AdminMembershipPayment = {
  id: string;
  term: string;
  plan: string;
  amount: number;
  payment_status: string;
  paid_at: string | null;
  created_at?: string | null;
};

export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  role: string;
  study_program: string;
  phone_number: string;
  gender?: string;
  term?: string | null;
  created_at?: string | null;
  membership_status: 'paid' | 'unpaid';
  membership_plan?: string | null;
  membership_paid_at?: string | null;
  membership_payments?: AdminMembershipPayment[];
}

export type AdminUserEventRegistration = {
  id: string;
  event_id: number;
  status: string;
  quoted_price: number;
  payment_required: boolean;
  payment_status: string;
  payment_completed_at: string | null;
  submitted_at: string | null;
  updated_at: string | null;
  event: {
    id: number;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    address: string;
  };
};

export type AdminUserRegistrations = {
  registrations: AdminUserEventRegistration[];
};

export type AdminTreasuryMembershipPayment = {
  id: string;
  user_id: string;
  term: string;
  plan: string;
  amount: number;
  payment_status: string;
  paid_at: string | null;
  created_at: string | null;
  email: string | null;
  user: { first_name: string; last_name: string; phone_number: string } | null;
};

export type AdminTreasuryEventRegistration = {
  id: string;
  event_id: number;
  user_id: string | null;
  status: string;
  quoted_price: number;
  payment_required: boolean;
  payment_status: string;
  payment_completed_at: string | null;
  submitted_at: string | null;
  updated_at: string | null;
  email: string | null;
  user: { first_name: string; last_name: string; phone_number: string } | null;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  } | null;
  event: { id: number; term: string; title: string; date: string } | null;
};

/** One row per actual payment, sourced directly from the transactions ledger. */
export type AdminTreasuryIncomeRow = {
  id: string;
  source: "membership" | "event" | "donation";
  term: string;
  amount: number;
  currency?: string;
  payment_status: string;
  paid_at: string | null;
  created_at?: string | null;
  payer_name: string;
  payer_email: string | null;
  payer_phone: string | null;
  member: boolean;
  plan: string | null;
  event_title: string | null;
  event_date: string | null;
};

export type AdminTreasuryReport = {
  terms: string[];
  current_term: string | null;
  memberships: AdminTreasuryMembershipPayment[];
  registrations: AdminTreasuryEventRegistration[];
  income: AdminTreasuryIncomeRow[];
};

export type AdminLinkedUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  gender: string;
  study_program: string;
  phone_number: string;
  term: string;
  created_at: string;
};

export type AdminRegistrationProfile = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: string;
  is_student: boolean;
  university_name: string;
  study_program: string | null;
  is_alumnus: boolean;
};

export type AdminRegistrationAnswer = {
  id: string;
  field_id: string;
  answer_payload: string | string[];
  field_type_snapshot: string;
  field_question_snapshot: string;
  created_at: string | null;
  field: {
    id: string;
    question: string;
    field_type: string;
    help_text: string | null;
    is_required: boolean;
  } | null;
};

export type AdminEventFormField = {
  id: string;
  question: string;
  field_type: string;
  help_text: string | null;
  is_required: boolean;
  sort_order: number;
  options?: string[];
};

export type AdminEventRegistration = {
  id: string;
  event_id: number;
  user_id: number | null;
  status: string;
  invitation_snapshot: string;
  siblings_snapshot: string;
  quoted_price: number;
  payment_required: boolean;
  stripe_session_id?: string | null;
  payment_status?: string;
  payment_completed_at?: string | null;
  submitted_at: string | null;
  updated_at: string | null;
  profile: AdminRegistrationProfile | null;
  answers: AdminRegistrationAnswer[];
  linked_user: AdminLinkedUser | null;
};

/**
 * Human-readable payment state for a registration. Payment status is fully
 * separate from the admin-driven seat-tracker `status` field.
 */
export const getPaymentLabel = (
  registration: Pick<AdminEventRegistration, "payment_required" | "payment_status">,
): string => {
  if (!registration.payment_required) return "Free";
  switch (registration.payment_status) {
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    default:
      return "Awaiting payment";
  }
};

export type AdminEventSummary = {
  id: number;
  term: string;
  is_published?: boolean;
  is_open?: boolean;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  deadline: string;
  address: string;
  invitation: string;
  siblings: string;
  price_member: number;
  price_nonmember: number;
  price_alumnus: number;
  poster?: string | null;
  registration_count: number;
};

export type AdminEventDetail = AdminEventSummary & {
  description: string | null;
  poster: string | null;
  form_fields: AdminEventFormField[];
  registrations: AdminEventRegistration[];
};
