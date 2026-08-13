import type { Database } from ']/types/types';
import { supabase } from ']/client';

type EventRow = Database['public']['Tables']['events_info']['Row'];
type EventFormFieldRow = Database['public']['Tables']['event_form_fields']['Row'];
type Gender = Database['public']['Enums']['Gender'];
type Invitation = Database['public']['Enums']['Invitation'];
type EventFormFieldType = Database['public']['Enums']['EventFormFieldType'];

// ── Types ───────────────────────────────────────────────────────────────────

export type RegistrationProfilePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  gender?: string;
  is_student?: boolean;
  university_name?: string;
  study_program?: string | null;
  is_alumnus?: boolean;
};

export type RegistrationAnswerPayload = {
  field_id: string;
  value?: unknown;
};

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_UNIVERSITY_NAME = 'Lund University';
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,14}$/;
const SCHOOL_TEXT_REGEX = /^[A-Za-z0-9À-ÖØ-öø-ÿ .,'()&+\/-]{2,100}$/;
const FORBIDDEN_REGISTRATION_BODY_KEYS = new Set([
  'event_id',
  'user_id',
  'status',
  'quoted_price',
  'payment_required',
  'stripe_session_id',
  'payment_status',
  'payment_completed_at',
  'invitation_snapshot',
  'siblings_snapshot',
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

const normalizeTrimmed = (value?: string | null) =>
  typeof value === 'string' ? value.trim() : '';

const boolOrDefault = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

const isGender = (value: string): value is Gender =>
  value === 'male' || value === 'female';

const normalizeFieldOptions = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((option) => (typeof option === 'string' ? option.trim() : ''))
    .filter(Boolean);
};

// ── Submit Registration ────────────────────────────────────────────────────

/**
 * POST /events/:id/register
 *
 * Validates profile + answers, resolves price server-side, and creates
 * the registration inside a transaction.
 */
export const submitRegistration = async (
  eventId: number,
  profilePayload: RegistrationProfilePayload,
  answersPayload: RegistrationAnswerPayload[],
) => {
  // ── Auth check ─────────────────────────────────────────────────────────
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && !/Auth session missing/i.test(userError.message)) {
    throw new Error(userError.message);
  }

  // ── Forbidden keys ─────────────────────────────────────────────────────
  const forbiddenKey = Object.keys(profilePayload).find((key) =>
    FORBIDDEN_REGISTRATION_BODY_KEYS.has(key),
  );
  if (forbiddenKey) {
    throw new Error(`Forbidden registration payload field: ${forbiddenKey}`);
  }

  // ── Validate answers ───────────────────────────────────────────────────
  if (
    !answersPayload.every(
      (a) => a && typeof a.field_id === 'string' && normalizeTrimmed(a.field_id),
    )
  ) {
    throw new Error('Invalid answers payload. Each answer must include a valid field_id.');
  }

  // ── Fetch event ────────────────────────────────────────────────────────
  const { data: event, error: eventError } = await supabase
    .from('events_info')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    throw new Error('Event not found');
  }

  if (new Date(event.deadline).getTime() <= Date.now()) {
    throw new Error('Registration deadline has passed.');
  }

  // ── Resolve user profile (if signed-in member) ────────────────────────
  let userRecord: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    gender: Gender;
    study_program: string;
  } | null = null;

  if (user && !user.is_anonymous) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, first_name, last_name, phone_number, gender, study_program')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('User no longer exists. Please sign in again.');
    }

    userRecord = {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: user.email ?? '',
      phone_number: profile.phone_number,
      gender: profile.gender as Gender,
      study_program: profile.study_program,
    };
  }

  // ── Membership status (paid for the current term) ──────────────────────
  // "Member" means a paid membership_payments row for the current term —
  // simply having an account is NOT enough.
  let hasPaidMembership = false;
  if (userRecord) {
    const { data: currentOptions } = await supabase
      .from('admin_options')
      .select('term')
      .eq('is_current', true)
      .maybeSingle();

    if (currentOptions) {
      const { data: paidRow } = await supabase
        .from('membership_payments')
        .select('id')
        .eq('user_id', userRecord.id)
        .eq('term', currentOptions.term as string)
        .eq('payment_status', 'paid')
        .maybeSingle();

      hasPaidMembership = Boolean(paidRow);
    }
  }

  // ── Members-only guard ─────────────────────────────────────────────────
  if (!hasPaidMembership && event.invitation === 'members') {
    throw new Error('This event is only available to paid members.');
  }

  // ── Resolve profile fields ─────────────────────────────────────────────
  const first_name = userRecord
    ? userRecord.first_name
    : normalizeTrimmed(profilePayload.first_name);
  const last_name = userRecord
    ? userRecord.last_name
    : normalizeTrimmed(profilePayload.last_name);
  const email = userRecord
    ? userRecord.email
    : normalizeTrimmed(profilePayload.email);
  const phone_number = userRecord
    ? userRecord.phone_number
    : normalizeTrimmed(profilePayload.phone_number);
  const genderValue = userRecord
    ? userRecord.gender
    : normalizeTrimmed(profilePayload.gender);
  let university_name = userRecord
    ? DEFAULT_UNIVERSITY_NAME
    : normalizeTrimmed(profilePayload.university_name);
  let study_program = userRecord
    ? userRecord.study_program || null
    : normalizeTrimmed(profilePayload.study_program) || null;
  let is_student = userRecord ? true : boolOrDefault(profilePayload.is_student, false);
  let is_alumnus = userRecord ? false : boolOrDefault(profilePayload.is_alumnus, false);

  // ── Validate required fields ───────────────────────────────────────────
  if (!first_name || !last_name || !email || !phone_number || !genderValue) {
    throw new Error('Missing essential fields in profile.');
  }
  if (!NAME_REGEX.test(first_name) || !NAME_REGEX.test(last_name)) {
    throw new Error('Invalid first or last name format.');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid email format.');
  }
  if (!PHONE_REGEX.test(phone_number)) {
    throw new Error('Invalid phone number format.');
  }
  if (!isGender(genderValue)) {
    throw new Error('Invalid gender value.');
  }

  // ── Invitation-specific validation (guests only) ───────────────────────
  if (!userRecord) {
    const invite = event.invitation as Invitation;

    if (is_student && is_alumnus) {
      throw new Error('Choose either student or alumnus status, not both.');
    }

    if (invite === 'non_members') {
      if (is_alumnus) throw new Error('Alumni are not allowed for this event.');
      if (!is_student) throw new Error('This event is only for students.');
      university_name = DEFAULT_UNIVERSITY_NAME;
      if (!study_program) throw new Error('Study program is required for this event.');
      if (!SCHOOL_TEXT_REGEX.test(study_program)) throw new Error('Invalid study program format.');
    }

    if (invite === 'alumni') {
      if (!is_alumnus && !is_student) throw new Error('This event is for students or alumni.');
      university_name = DEFAULT_UNIVERSITY_NAME;
      if (is_alumnus) {
        study_program = null;
      } else if (!study_program) {
        throw new Error('Study program is required for students.');
      } else if (!SCHOOL_TEXT_REGEX.test(study_program)) {
        throw new Error('Invalid study program format.');
      }
    }

    if (invite === 'all_students') {
      if (!is_alumnus && !is_student) throw new Error('This event is for students or alumni.');
      if (is_alumnus) {
        study_program = null;
      } else {
        if (!university_name) throw new Error('University name is required for students.');
        if (!SCHOOL_TEXT_REGEX.test(university_name)) throw new Error('Invalid university name format.');
        if (!study_program) throw new Error('Study program is required for students.');
        if (!SCHOOL_TEXT_REGEX.test(study_program)) throw new Error('Invalid study program format.');
      }
    }

    if (invite === 'non_students') {
      if (is_student) {
        if (!university_name) throw new Error('University name is required for students.');
        if (!SCHOOL_TEXT_REGEX.test(university_name)) throw new Error('Invalid university name format.');
        if (!study_program) throw new Error('Study program is required for students.');
        if (!SCHOOL_TEXT_REGEX.test(study_program)) throw new Error('Invalid study program format.');
      } else {
        study_program = null;
      }
    }

    if (!university_name) university_name = 'N/A';
  }

  // ── Sign in anonymously (after validation so we can pass profile data) ─
  let authUserId: string;

  if (user) {
    authUserId = user.id;
  } else {
    const { data: anonData, error: anonError } =
      await supabase.auth.signInAnonymously({
        options: {
          data: {
            first_name,
            last_name,
            phone_number,
            gender: genderValue,
          },
        },
      });

    if (anonError || !anonData.user) {
      throw new Error('Failed to create anonymous session. Please try again.');
    }

    authUserId = anonData.user.id;
  }

  // ── Fetch form fields ──────────────────────────────────────────────────
  const { data: formFields, error: fieldsError } = await supabase
    .from('event_form_fields')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (fieldsError) throw new Error(fieldsError.message);

  const fieldById = new Map((formFields ?? []).map((f) => [f.id, f]));
  const seenAnswerFieldIds = new Set<string>();

  for (const answer of answersPayload) {
    const fieldId = normalizeTrimmed(answer.field_id);
    if (seenAnswerFieldIds.has(fieldId)) {
      throw new Error(`Duplicate answer submitted for field id: ${fieldId}`);
    }
    seenAnswerFieldIds.add(fieldId);

    if (!fieldById.has(fieldId)) {
      throw new Error(`Unknown form field id submitted: ${fieldId}`);
    }
  }

  const answersByFieldId = new Map(
    answersPayload.map((a) => [a.field_id, a]),
  );

  for (const field of formFields ?? []) {
    const answer = answersByFieldId.get(field.id);

    if (!answer) {
      if (field.is_required) {
        throw new Error(`Missing required answer for field: ${field.question}`);
      }
      continue;
    }

    if (field.field_type === 'short_text') {
      const text = normalizeTrimmed(typeof answer.value === 'string' ? answer.value : '');
      if (field.is_required && !text) {
        throw new Error(`Field requires a text answer: ${field.question}`);
      }
    }

    if (field.field_type === 'radio_single') {
      const selected = normalizeTrimmed(typeof answer.value === 'string' ? answer.value : '');
      const validOptions = new Set(normalizeFieldOptions(field.options));
      if (!selected && field.is_required) {
        throw new Error(`Field requires one selected option: ${field.question}`);
      }
      if (selected && !validOptions.has(selected)) {
        throw new Error(`Invalid option selected for field: ${field.question}`);
      }
    }

    if (field.field_type === 'checkbox_multi') {
      const selectedOptions = Array.isArray(answer.value)
        ? answer.value
            .map((item: unknown) => normalizeTrimmed(typeof item === 'string' ? item : ''))
            .filter(Boolean)
        : [];
      const validOptions = new Set(normalizeFieldOptions(field.options));
      if (selectedOptions.length === 0 && field.is_required) {
        throw new Error(`Field requires at least one option: ${field.question}`);
      }
      const hasInvalidOption = selectedOptions.some((v) => !validOptions.has(v));
      if (hasInvalidOption) {
        throw new Error(`Invalid option selected for field: ${field.question}`);
      }
    }
  }

  // ── Resolve price ──────────────────────────────────────────────────────
  const quotedPrice = hasPaidMembership
    ? event.price_member
    : is_alumnus
      ? event.price_alumnus
      : event.price_nonmember;

  // ── Check for duplicate registration ───────────────────────────────────
  const { data: existing } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', authUserId)
    .neq('status', 'cancelled')
    .maybeSingle();

  if (existing) {
    throw new Error('You are already registered for this event.');
  }

  // ── Create registration ────────────────────────────────────────────────
  const registrationId = crypto.randomUUID();

  // Insert registration
  const now = new Date().toISOString();
  const { error: regError } = await supabase.from('event_registrations').insert({
    id: registrationId,
    event_id: eventId,
    user_id: authUserId,
    status: 'pending',
    invitation_snapshot: event.invitation,
    siblings_snapshot: event.siblings,
    quoted_price: quotedPrice,
    payment_required: quotedPrice > 0,
    submitted_at: now,
    updated_at: now,
  });

  if (regError) throw new Error(regError.message);

  // Insert profile
  const { error: profileError } = await supabase
    .from('event_registration_profiles')
    .insert({
      registration_id: registrationId,
      first_name,
      last_name,
      email,
      phone_number,
      gender: genderValue as Gender,
      is_student,
      university_name,
      study_program,
      is_alumnus,
    });

  if (profileError) throw new Error(profileError.message);

  // Insert answers
  const answerRows = answersPayload
    .map((answer) => {
      const field = fieldById.get(answer.field_id);
      if (!field) return null;

      const answerPayload: string | string[] =
        field.field_type === 'checkbox_multi'
          ? Array.isArray(answer.value)
            ? answer.value
                .map((v: unknown) => normalizeTrimmed(typeof v === 'string' ? v : ''))
                .filter(Boolean)
            : []
          : normalizeTrimmed(typeof answer.value === 'string' ? answer.value : '');

      return {
        id: crypto.randomUUID(),
        registration_id: registrationId,
        field_id: field.id,
        answer_payload: answerPayload,
        field_type_snapshot: field.field_type as EventFormFieldType,
        field_question_snapshot: field.question,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (answerRows.length > 0) {
    const { error: answersError } = await supabase
      .from('event_registration_field_answers')
      .insert(answerRows);

    if (answersError) throw new Error(answersError.message);
  }

  return {
    message: 'Registration submitted successfully',
    registration_id: registrationId,
    status: 'pending',
    payment_required: quotedPrice > 0,
  };
};

