// register-event — the single authoritative path for event registration.
//
// Derives price, eligibility, deadline, status, and payment requirements
// SERVER-SIDE from the event row. The client never supplies these values.
// Runs with the service-role client (bypasses RLS); the caller's identity is
// verified via auth.getUser() and the registration is always tied to the
// authenticated user. Direct client writes to event_registrations are revoked
// by RLS (see supabase/sql/lock_registration_writes.sql).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  adminClient,
  corsHeaders,
  jsonResponse,
  userClient,
} from '../_shared/db.ts';
import { eventPrice, hasPaidMembership } from '../_shared/event-pricing.ts';

// ── Types ───────────────────────────────────────────────────────────────────

type ProfilePayload = {
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

type AnswerPayload = {
  field_id: string;
  value?: unknown;
};

type RegisterRequest = {
  eventId?: number;
  profile?: ProfilePayload;
  answers?: AnswerPayload[];
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
  'transaction_id',
  'invitation_snapshot',
  'siblings_snapshot',
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

const normalizeTrimmed = (value?: string | null) =>
  typeof value === 'string' ? value.trim() : '';

const boolOrDefault = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

const isGender = (value: string) => value === 'male' || value === 'female';

const normalizeFieldOptions = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((option) => (typeof option === 'string' ? option.trim() : ''))
    .filter(Boolean);
};

// ── Main ────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as RegisterRequest;

    // ── Auth ────────────────────────────────────────────────────────────────
    const {
      data: { user },
      error: authError,
    } = await userClient(req).auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const eventId = body.eventId;
    const profilePayload = body.profile ?? {};
    const answersPayload = body.answers ?? [];

    if (!Number.isInteger(eventId)) {
      return jsonResponse({ error: 'eventId is required' }, 400);
    }

    // ── Forbidden keys ─────────────────────────────────────────────────────
    const forbiddenKey = Object.keys(profilePayload).find((key) =>
      FORBIDDEN_REGISTRATION_BODY_KEYS.has(key),
    );
    if (forbiddenKey) {
      return jsonResponse(
        { error: `Forbidden registration payload field: ${forbiddenKey}` },
        400,
      );
    }

    // ── Validate answers shape ─────────────────────────────────────────────
    if (
      !answersPayload.every(
        (a) =>
          a && typeof a.field_id === 'string' && normalizeTrimmed(a.field_id),
      )
    ) {
      return jsonResponse(
        { error: 'Invalid answers payload. Each answer must include a valid field_id.' },
        400,
      );
    }

    // ── Fetch event (server-side, authoritative) ───────────────────────────
    const { data: event, error: eventError } = await adminClient
      .from('events_info')
      .select('*')
      .eq('id', eventId)
      .single();
    if (eventError || !event) {
      return jsonResponse({ error: 'Event not found' }, 404);
    }

    if (!event.is_published) {
      return jsonResponse({ error: 'Event not found' }, 404);
    }

    if (event.is_open === false) {
      return jsonResponse(
        { error: 'Signups are not open for this event yet.' },
        400,
      );
    }

    if (new Date(event.deadline).getTime() <= Date.now()) {
      return jsonResponse({ error: 'Registration deadline has passed.' }, 400);
    }

    // ── Resolve user profile (signed-in members only) ──────────────────────
    let userRecord: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      gender: string;
      study_program: string;
    } | null = null;

    if (!user.is_anonymous) {
      const { data: profile } = await adminClient
        .from('users')
        .select('id, first_name, last_name, phone_number, gender, study_program')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return jsonResponse(
          { error: 'User no longer exists. Please sign in again.' },
          401,
        );
      }

      userRecord = {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: user.email ?? '',
        phone_number: profile.phone_number,
        gender: profile.gender,
        study_program: profile.study_program,
      };
    }

    // ── Membership status (paid for the current term) ──────────────────────
    let paidMembership = false;
    if (userRecord) {
      paidMembership = await hasPaidMembership(adminClient, userRecord.id);
    }

    // ── Members-only guard ─────────────────────────────────────────────────
    if (!paidMembership && event.invitation === 'members') {
      return jsonResponse(
        { error: 'This event is only available to paid members.' },
        403,
      );
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
    let is_student = userRecord
      ? true
      : boolOrDefault(profilePayload.is_student, false);
    let is_alumnus = userRecord
      ? false
      : boolOrDefault(profilePayload.is_alumnus, false);

    // ── Validate required fields ───────────────────────────────────────────
    if (!first_name || !last_name || !email || !phone_number || !genderValue) {
      return jsonResponse({ error: 'Missing essential fields in profile.' }, 400);
    }
    if (!NAME_REGEX.test(first_name) || !NAME_REGEX.test(last_name)) {
      return jsonResponse({ error: 'Invalid first or last name format.' }, 400);
    }
    if (!EMAIL_REGEX.test(email)) {
      return jsonResponse({ error: 'Invalid email format.' }, 400);
    }
    if (!PHONE_REGEX.test(phone_number)) {
      return jsonResponse({ error: 'Invalid phone number format.' }, 400);
    }
    if (!isGender(genderValue)) {
      return jsonResponse({ error: 'Invalid gender value.' }, 400);
    }

    // ── Invitation-specific validation (guests only) ───────────────────────
    if (!userRecord) {
      const invite = event.invitation as string;

      if (is_student && is_alumnus) {
        return jsonResponse(
          { error: 'Choose either student or alumnus status, not both.' },
          400,
        );
      }

      if (invite === 'non_members') {
        if (is_alumnus) {
          return jsonResponse({ error: 'Alumni are not allowed for this event.' }, 400);
        }
        if (!is_student) {
          return jsonResponse({ error: 'This event is only for students.' }, 400);
        }
        university_name = DEFAULT_UNIVERSITY_NAME;
        if (!study_program) {
          return jsonResponse({ error: 'Study program is required for this event.' }, 400);
        }
        if (!SCHOOL_TEXT_REGEX.test(study_program)) {
          return jsonResponse({ error: 'Invalid study program format.' }, 400);
        }
      }

      if (invite === 'alumni') {
        if (!is_alumnus && !is_student) {
          return jsonResponse({ error: 'This event is for students or alumni.' }, 400);
        }
        university_name = DEFAULT_UNIVERSITY_NAME;
        if (is_alumnus) {
          study_program = null;
        } else if (!study_program) {
          return jsonResponse({ error: 'Study program is required for students.' }, 400);
        } else if (!SCHOOL_TEXT_REGEX.test(study_program)) {
          return jsonResponse({ error: 'Invalid study program format.' }, 400);
        }
      }

      if (invite === 'all_students') {
        if (!is_alumnus && !is_student) {
          return jsonResponse({ error: 'This event is for students or alumni.' }, 400);
        }
        if (is_alumnus) {
          study_program = null;
        } else {
          if (!university_name) {
            return jsonResponse({ error: 'University name is required for students.' }, 400);
          }
          if (!SCHOOL_TEXT_REGEX.test(university_name)) {
            return jsonResponse({ error: 'Invalid university name format.' }, 400);
          }
          if (!study_program) {
            return jsonResponse({ error: 'Study program is required for students.' }, 400);
          }
          if (!SCHOOL_TEXT_REGEX.test(study_program)) {
            return jsonResponse({ error: 'Invalid study program format.' }, 400);
          }
        }
      }

      if (invite === 'non_students') {
        if (is_student) {
          if (!university_name) {
            return jsonResponse({ error: 'University name is required for students.' }, 400);
          }
          if (!SCHOOL_TEXT_REGEX.test(university_name)) {
            return jsonResponse({ error: 'Invalid university name format.' }, 400);
          }
          if (!study_program) {
            return jsonResponse({ error: 'Study program is required for students.' }, 400);
          }
          if (!SCHOOL_TEXT_REGEX.test(study_program)) {
            return jsonResponse({ error: 'Invalid study program format.' }, 400);
          }
        } else {
          study_program = null;
        }
      }

      if (!university_name) university_name = 'N/A';
    }

    // ── Fetch form fields ──────────────────────────────────────────────────
    const { data: formFields, error: fieldsError } = await adminClient
      .from('event_form_fields')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });

    if (fieldsError) return jsonResponse({ error: fieldsError.message }, 500);

    const fieldById = new Map((formFields ?? []).map((f) => [f.id, f]));
    const seenAnswerFieldIds = new Set<string>();

    for (const answer of answersPayload) {
      const fieldId = normalizeTrimmed(answer.field_id);
      if (seenAnswerFieldIds.has(fieldId)) {
        return jsonResponse(
          { error: `Duplicate answer submitted for field id: ${fieldId}` },
          400,
        );
      }
      seenAnswerFieldIds.add(fieldId);

      if (!fieldById.has(fieldId)) {
        return jsonResponse(
          { error: `Unknown form field id submitted: ${fieldId}` },
          400,
        );
      }
    }

    const answersByFieldId = new Map(answersPayload.map((a) => [a.field_id, a]));

    for (const field of formFields ?? []) {
      const answer = answersByFieldId.get(field.id);

      if (!answer) {
        if (field.is_required) {
          return jsonResponse(
            { error: `Missing required answer for field: ${field.question}` },
            400,
          );
        }
        continue;
      }

      if (field.field_type === 'short_text') {
        const text = normalizeTrimmed(
          typeof answer.value === 'string' ? answer.value : '',
        );
        if (field.is_required && !text) {
          return jsonResponse(
            { error: `Field requires a text answer: ${field.question}` },
            400,
          );
        }
      }

      if (field.field_type === 'radio_single') {
        const selected = normalizeTrimmed(
          typeof answer.value === 'string' ? answer.value : '',
        );
        const validOptions = new Set(normalizeFieldOptions(field.options));
        if (!selected && field.is_required) {
          return jsonResponse(
            { error: `Field requires one selected option: ${field.question}` },
            400,
          );
        }
        if (selected && !validOptions.has(selected)) {
          return jsonResponse(
            { error: `Invalid option selected for field: ${field.question}` },
            400,
          );
        }
      }

      if (field.field_type === 'checkbox_multi') {
        const selectedOptions = Array.isArray(answer.value)
          ? answer.value
              .map((item: unknown) =>
                normalizeTrimmed(typeof item === 'string' ? item : ''),
              )
              .filter(Boolean)
          : [];
        const validOptions = new Set(normalizeFieldOptions(field.options));
        if (selectedOptions.length === 0 && field.is_required) {
          return jsonResponse(
            { error: `Field requires at least one option: ${field.question}` },
            400,
          );
        }
        const hasInvalidOption = selectedOptions.some(
          (v) => !validOptions.has(v),
        );
        if (hasInvalidOption) {
          return jsonResponse(
            { error: `Invalid option selected for field: ${field.question}` },
            400,
          );
        }
      }
    }

    // ── Resolve price (server-side, from the event) ────────────────────────
    const quotedPrice = eventPrice(event, paidMembership, is_alumnus);

    // ── Duplicate registration check ───────────────────────────────────────
    const { data: existing } = await adminClient
      .from('event_registrations')
      .select('id, payment_required, transaction:transactions(payment_status)')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existing) {
      if (
        existing.payment_required &&
        existing.transaction?.payment_status !== 'paid'
      ) {
        return jsonResponse(
          {
            error:
              'You already have a pending payment for this event. Complete your payment to finish registering.',
          },
          409,
        );
      }
      return jsonResponse(
        { error: 'You are already registered for this event.' },
        409,
      );
    }

    // ── Create registration (server-side) ──────────────────────────────────
    const registrationId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: regError } = await adminClient
      .from('event_registrations')
      .insert({
        id: registrationId,
        event_id: eventId,
        user_id: user.id,
        status: 'pending',
        invitation_snapshot: event.invitation,
        siblings_snapshot: event.siblings,
        quoted_price: quotedPrice,
        payment_required: quotedPrice > 0,
        submitted_at: now,
        updated_at: now,
      });

    if (regError) return jsonResponse({ error: regError.message }, 500);

    // Insert profile.
    const { error: profileError } = await adminClient
      .from('event_registration_profiles')
      .insert({
        registration_id: registrationId,
        first_name,
        last_name,
        email,
        phone_number,
        gender: genderValue,
        is_student,
        university_name,
        study_program,
        is_alumnus,
      });

    if (profileError) {
      // Roll back the registration so we don't leave an orphan row.
      await adminClient
        .from('event_registrations')
        .delete()
        .eq('id', registrationId);
      return jsonResponse({ error: profileError.message }, 500);
    }

    // Insert answers.
    const answerRows = answersPayload
      .map((answer) => {
        const field = fieldById.get(answer.field_id);
        if (!field) return null;

        const answerPayload: string | string[] =
          field.field_type === 'checkbox_multi'
            ? Array.isArray(answer.value)
              ? answer.value
                  .map((v: unknown) =>
                    normalizeTrimmed(typeof v === 'string' ? v : ''),
                  )
                  .filter(Boolean)
              : []
            : normalizeTrimmed(typeof answer.value === 'string' ? answer.value : '');

        return {
          id: crypto.randomUUID(),
          registration_id: registrationId,
          field_id: field.id,
          answer_payload: answerPayload,
          field_type_snapshot: field.field_type,
          field_question_snapshot: field.question,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (answerRows.length > 0) {
      const { error: answersError } = await adminClient
        .from('event_registration_field_answers')
        .insert(answerRows);

      if (answersError) {
        await adminClient
          .from('event_registrations')
          .delete()
          .eq('id', registrationId);
        return jsonResponse({ error: answersError.message }, 500);
      }
    }

    return jsonResponse({
      message: 'Registration submitted successfully',
      registration_id: registrationId,
      status: 'pending',
      payment_required: quotedPrice > 0,
    });
  } catch (error) {
    console.error('register-event error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    );
  }
});
