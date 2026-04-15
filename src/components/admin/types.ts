export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  study_program: string;
  phone_number: string;
  created_at: string;
}

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
  submitted_at: string | null;
  updated_at: string | null;
  profile: AdminRegistrationProfile | null;
  answers: AdminRegistrationAnswer[];
  linked_user: AdminLinkedUser | null;
};

export type AdminEventSummary = {
  id: number;
  term: string;
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
