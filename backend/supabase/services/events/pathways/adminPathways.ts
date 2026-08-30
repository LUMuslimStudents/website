import type { Database } from ']/types/types';
import { supabase } from ']/client';
import { fixEventDateTimeFormat, toEventFormFieldResponse } from './shared';

type EventRow = Database['public']['Tables']['events_info']['Row'];
type EventFormFieldRow = Database['public']['Tables']['event_form_fields']['Row'];
type EventRegistrationRow = Database['public']['Tables']['event_registrations']['Row'];
type RegistrationProfileRow = Database['public']['Tables']['event_registration_profiles']['Row'];
type FieldAnswerRow = Database['public']['Tables']['event_registration_field_answers']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type RegistrationStatus = Database['public']['Enums']['EventRegistrationStatus'];
type EventFormFieldType = Database['public']['Enums']['EventFormFieldType'];
type Invitation = Database['public']['Enums']['Invitation'];
type Siblings = Database['public']['Enums']['Siblings'];

// ── Types ───────────────────────────────────────────────────────────────────

export type RegistrationStatusUpdate = {
  registration_id: string;
  status: RegistrationStatus;
};

type CreateEventInput = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  deadline: string;
  address: string;
  invitation?: Invitation;
  siblings?: Siblings;
  price_member?: number;
  price_nonmember?: number;
  price_alumnus?: number;
  description?: string | null;
  poster?: string | null;
  form_fields?: FormFieldInput[];
  is_published?: boolean;
};

type UpdateEventInput = Partial<CreateEventInput>;

type FormFieldInput = {
  id?: string;
  question: string;
  help_text?: string | null;
  field_type: EventFormFieldType;
  is_required?: boolean;
  sort_order?: number;
  options?: string[];
};

const REGISTRATION_STATUSES: RegistrationStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
  'waitlisted',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatDateTime = (value: string | null) => value ?? null;

/**
 * A registration counts as "real" (occupies a seat) only when it's paid, or
 * when no payment is required. Unpaid paid-event rows are drafts and are
 * excluded from counts. Cancelled rows never count either. The status field
 * itself is only ever changed by admins (seat tracker).
 */
const isRealRegistration = (r: {
  status?: string | null;
  payment_required?: boolean | null;
  payment_status?: string | null;
}) => r.status !== 'cancelled' && (!r.payment_required || r.payment_status === 'paid');

const ensureAdmin = async () => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Access denied. Not authenticated.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Access denied. Admin role required.');
  }

  return user;
};

const getLinkedUsers = async (userIds: string[]) => {
  if (userIds.length === 0) return new Map<string, UserRow>();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds);

  if (error) throw new Error(error.message);

  return new Map((data ?? []).map((u) => [u.id, u]));
};

const buildRegistrationResponse = (
  registration: EventRegistrationRow & {
    transaction?: { payment_status: string; paid_at: string | null } | null;
    profile?: RegistrationProfileRow | null;
    answers?: (FieldAnswerRow & {
      field?: Pick<EventFormFieldRow, 'id' | 'question' | 'field_type' | 'help_text' | 'is_required'> | null;
    })[];
  },
  linkedUserMap: Map<string, UserRow>,
) => ({
  ...registration,
  submitted_at: formatDateTime(registration.submitted_at),
  updated_at: formatDateTime(registration.updated_at),
  payment_status: registration.transaction?.payment_status ?? 'unpaid',
  payment_completed_at: registration.transaction?.paid_at ?? null,
  linked_user:
    registration.user_id && linkedUserMap.has(registration.user_id)
      ? linkedUserMap.get(registration.user_id) ?? null
      : null,
  profile: registration.profile ?? null,
  answers: (registration.answers ?? []).map((a) => ({
    ...a,
    created_at: formatDateTime(a.created_at),
  })),
});

// ── GET /admin/events ───────────────────────────────────────────────────────

export const getAdminEvents = async () => {
  await ensureAdmin();

  const { data: events, error } = await supabase
    .from('events_info')
    .select('*, registrations:event_registrations(id, status, payment_required, transaction:transactions(payment_status))')
    .order('deadline', { ascending: false });

  if (error) throw new Error(error.message);

  return (events ?? []).map((event) => ({
    ...fixEventDateTimeFormat(event as unknown as EventRow),
    registration_count: Array.isArray(event.registrations)
      ? event.registrations
          .map((r: any) => ({ ...r, payment_status: r.transaction?.payment_status ?? 'unpaid' }))
          .filter(isRealRegistration).length
      : 0,
  }));
};

// ── GET /admin/events/:id ───────────────────────────────────────────────────

export const getAdminEventById = async (eventId: number) => {
  await ensureAdmin();

  const { data: event, error } = await supabase
    .from('events_info')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) throw new Error('Event not found');

  // Fetch form fields
  const { data: formFields } = await supabase
    .from('event_form_fields')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  // Fetch registrations with profiles and answers
  const { data: registrations, error: regError } = await supabase
    .from('event_registrations')
    .select(
      '*, transaction:transactions(payment_status, paid_at), profile:event_registration_profiles(*), answers:event_registration_field_answers(*, field:event_form_fields(id, question, field_type, help_text, is_required))',
    )
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false })
    .order('created_at', { referencedTable: 'event_registration_field_answers', ascending: true });

  if (regError) throw new Error(regError.message);

  const userIds = Array.from(
    new Set(
      (registrations ?? [])
        .map((r) => r.user_id)
        .filter((id): id is string => id !== null),
    ),
  );
  const linkedUserMap = await getLinkedUsers(userIds);

  return {
    ...fixEventDateTimeFormat(event as EventRow),
    registration_count: (registrations ?? [])
      .map((r: any) => ({ ...r, payment_status: r.transaction?.payment_status ?? 'unpaid' }))
      .filter(isRealRegistration).length,
    form_fields: (formFields ?? []).map(toEventFormFieldResponse),
    registrations: (registrations ?? []).map((r) =>
      buildRegistrationResponse(r as any, linkedUserMap),
    ),
  };
};

// ── GET /admin/events-with-registrations ────────────────────────────────────

export const getAdminEventsWithRegistrations = async () => {
  await ensureAdmin();

  const { data: events, error } = await supabase
    .from('events_info')
    .select(
      '*, registrations:event_registrations(*, transaction:transactions(payment_status, paid_at), profile:event_registration_profiles(*), answers:event_registration_field_answers(*, field:event_form_fields(id, question, field_type, help_text, is_required)))',
    )
    .order('deadline', { ascending: false })
    .order('submitted_at', { referencedTable: 'event_registrations', ascending: false })
    .order('created_at', { referencedTable: 'event_registration_field_answers', ascending: true });

  if (error) throw new Error(error.message);

  const allUserIds = Array.from(
    new Set(
      (events ?? []).flatMap((e) =>
        (Array.isArray(e.registrations) ? e.registrations : [])
          .map((r: any) => r.user_id)
          .filter((id: unknown): id is string => id !== null),
      ),
    ),
  );
  const linkedUserMap = await getLinkedUsers(allUserIds);

  return (events ?? []).map((event) => ({
    ...fixEventDateTimeFormat(event as unknown as EventRow),
    registrations: (Array.isArray(event.registrations) ? event.registrations : []).map(
      (r: any) => buildRegistrationResponse(r, linkedUserMap),
    ),
  }));
};

// ── POST /admin/create-event ────────────────────────────────────────────────

export const createEvent = async (input: CreateEventInput) => {
  await ensureAdmin();

  const {
    title,
    date,
    start_time: startTime,
    end_time: endTime,
    deadline,
    address,
    invitation = 'members',
    siblings = 'all',
    price_member = 0,
    price_nonmember = 0,
    price_alumnus = 0,
    description = null,
    form_fields = [],
    is_published = true,
  } = input;

  if (!title || !date || !startTime || !endTime || !deadline || !address) {
    throw new Error('Missing required fields');
  }

  // Validate date formats
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format. Use YYYY-MM-DD.');
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(startTime)) throw new Error('Invalid start time format. Use HH:MM.');
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(endTime)) throw new Error('Invalid end time format. Use HH:MM.');

  const parsedDeadline = new Date(deadline);
  if (Number.isNaN(parsedDeadline.getTime())) throw new Error('Invalid deadline format.');

  // Get the current term from admin_options
  const { data: currentOptions } = await supabase
    .from('admin_options')
    .select('term')
    .eq('is_current', true)
    .maybeSingle();
  const currentTerm = currentOptions?.term ?? 'XXXX';

  // Insert event
  const { data: event, error } = await supabase
    .from('events_info')
    .insert({
      term: currentTerm,
      title,
      date,
      start_time: startTime.substring(0, 5),
      end_time: endTime.substring(0, 5),
      deadline,
      address,
      invitation: invitation as Invitation,
      siblings: siblings as Siblings,
      price_member,
      price_nonmember,
      price_alumnus,
      description,
      poster: input.poster ?? null,
      is_published,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('An event with this title already exists.');
    }
    throw new Error(error.message);
  }

  // Insert form fields
  if (form_fields.length > 0) {
    const now = new Date().toISOString();
    const { error: fieldsError } = await supabase.from('event_form_fields').insert(
      form_fields.map((f, i) => ({
        id: crypto.randomUUID(),
        event_id: event.id,
        question: f.question,
        help_text: f.help_text ?? null,
        field_type: f.field_type as EventFormFieldType,
        is_required: f.is_required ?? false,
        sort_order: f.sort_order ?? i,
        options: f.options ?? null,
        updated_at: now,
      })),
    );

    if (fieldsError) throw new Error(fieldsError.message);
  }

  return {
    message: 'Event created successfully',
    event: fixEventDateTimeFormat(event as EventRow),
  };
};

// ── PATCH /admin/events/:id ─────────────────────────────────────────────────

export const updateEvent = async (eventId: number, input: UpdateEventInput) => {
  await ensureAdmin();

  const { data: existing } = await supabase
    .from('events_info')
    .select('id')
    .eq('id', eventId)
    .single();

  if (!existing) throw new Error('Event not found');

  const updateData: Database['public']['Tables']['events_info']['Update'] = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    updateData.date = input.date;
  }
  if (input.start_time !== undefined) {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.start_time))
      throw new Error('Invalid start time format. Use HH:MM.');
    updateData.start_time = input.start_time.substring(0, 5);
  }
  if (input.end_time !== undefined) {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.end_time))
      throw new Error('Invalid end time format. Use HH:MM.');
    updateData.end_time = input.end_time.substring(0, 5);
  }
  if (input.deadline !== undefined) {
    const parsed = new Date(input.deadline);
    if (Number.isNaN(parsed.getTime())) throw new Error('Invalid deadline format.');
    updateData.deadline = input.deadline;
  }
  if (input.address !== undefined) updateData.address = input.address;
  if (input.invitation !== undefined) updateData.invitation = input.invitation;
  if (input.siblings !== undefined) updateData.siblings = input.siblings;
  if (input.price_member !== undefined) updateData.price_member = input.price_member;
  if (input.price_nonmember !== undefined) updateData.price_nonmember = input.price_nonmember;
  if (input.price_alumnus !== undefined) updateData.price_alumnus = input.price_alumnus;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.is_published !== undefined) updateData.is_published = input.is_published;
  if (input.poster !== undefined) updateData.poster = input.poster;

  if (Object.keys(updateData).length === 0 && !input.form_fields) {
    throw new Error('No fields to update');
  }

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('events_info')
      .update(updateData as any)
      .eq('id', eventId);

    if (error) {
      if (error.code === '23505') {
        throw new Error('An event with this title already exists.');
      }
      throw new Error(error.message);
    }
  }

  // Handle form fields update
  if (input.form_fields) {
    const { data: existingFields } = await supabase
      .from('event_form_fields')
      .select('id')
      .eq('event_id', eventId);

    const existingFieldIds = new Set((existingFields ?? []).map((f) => f.id));
    const seenFieldIds = new Set<string>();

    for (const field of input.form_fields) {
      if (field.id && existingFieldIds.has(field.id)) {
        seenFieldIds.add(field.id);
        const { error: updateErr } = await supabase
          .from('event_form_fields')
          .update({
            question: field.question,
            help_text: field.help_text ?? null,
            field_type: field.field_type,
            is_required: field.is_required ?? false,
            sort_order: field.sort_order ?? 0,
            options: field.options ?? null,
          })
          .eq('id', field.id);

        if (updateErr) throw new Error(updateErr.message);
      } else {
        const now = new Date().toISOString();
        const { data: created, error: createErr } = await supabase
          .from('event_form_fields')
          .insert({
            id: crypto.randomUUID(),
            event_id: eventId,
            question: field.question,
            help_text: field.help_text ?? null,
            field_type: field.field_type as EventFormFieldType,
            is_required: field.is_required ?? false,
            sort_order: field.sort_order ?? 0,
            options: field.options ?? null,
            updated_at: now,
          })
          .select('id')
          .single();

        if (createErr) throw new Error(createErr.message);
        if (created) seenFieldIds.add(created.id);
      }
    }

    // Remove fields no longer present
    const removedIds = [...existingFieldIds].filter((id) => !seenFieldIds.has(id));
    if (removedIds.length > 0) {
      const { error: deleteErr } = await supabase
        .from('event_form_fields')
        .delete()
        .in('id', removedIds);

      if (deleteErr) throw new Error(deleteErr.message);
    }
  }

  return {
    message: 'Event updated successfully',
  };
};

// ── PATCH /admin/events/:id/publish-state ───────────────────────────────────

export const updateEventPublishState = async (
  eventId: number,
  isPublished: boolean,
) => {
  await ensureAdmin();

  const { data: existing } = await supabase
    .from('events_info')
    .select('id')
    .eq('id', eventId)
    .single();

  if (!existing) throw new Error('Event not found');

  const { error } = await supabase
    .from('events_info')
    .update({ is_published: isPublished })
    .eq('id', eventId);

  if (error) throw new Error(error.message);

  return {
    message: isPublished
      ? 'Event published successfully'
      : 'Event unpublished successfully',
    event: {
      is_published: isPublished,
    },
  };
};

// ── PATCH /admin/events/:id/registrations/status ────────────────────────────

export const updateRegistrationStatuses = async (
  eventId: number,
  updates: RegistrationStatusUpdate[],
) => {
  await ensureAdmin();

  if (updates.length === 0) {
    throw new Error('No registration status updates provided');
  }

  const normalized = updates.map((u) => ({
    registration_id: u.registration_id?.trim() ?? '',
    status: u.status,
  }));

  if (normalized.some((u) => !u.registration_id)) {
    throw new Error('Each update must include a registration_id');
  }

  if (
    normalized.some(
      (u) => !REGISTRATION_STATUSES.includes(u.status as RegistrationStatus),
    )
  ) {
    throw new Error('Invalid registration status supplied');
  }

  const registrationIds = normalized.map((u) => u.registration_id);
  const uniqueIds = new Set(registrationIds);
  if (uniqueIds.size !== registrationIds.length) {
    throw new Error('Duplicate registration updates supplied');
  }

  // Verify all registrations belong to this event
  const { data: registrations, error } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .in('id', registrationIds);

  if (error) throw new Error(error.message);
  if ((registrations ?? []).length !== registrationIds.length) {
    throw new Error('One or more registrations were not found for this event.');
  }

  const updatesById = new Map(
    normalized.map((u) => [u.registration_id, u.status]),
  );

  for (const reg of registrations ?? []) {
    const status = updatesById.get(reg.id);
    if (!status) continue;

    const { error: updateErr } = await supabase
      .from('event_registrations')
      .update({ status: status as RegistrationStatus })
      .eq('id', reg.id);

    if (updateErr) throw new Error(updateErr.message);
  }

  // Return updated registrations
  const { data: updated } = await supabase
    .from('event_registrations')
    .select('id, status, updated_at')
    .eq('event_id', eventId)
    .in('id', registrationIds);

  return {
    message: 'Registration statuses updated successfully',
    registrations: (updated ?? []).map((r) => ({
      ...r,
      updated_at: formatDateTime(r.updated_at),
    })),
  };
};

// ── DELETE /admin/events/:id/registrations/:registrationId ──────────────────

export const deleteRegistration = async (
  eventId: number,
  registrationId: string,
) => {
  await ensureAdmin();

  if (!registrationId) throw new Error('Invalid registration id');

  const { data: registration, error } = await supabase
    .from('event_registrations')
    .select('id, status')
    .eq('id', registrationId)
    .eq('event_id', eventId)
    .single();

  if (error || !registration) {
    throw new Error('Registration not found for this event.');
  }

  const { error: deleteErr } = await supabase
    .from('event_registrations')
    .delete()
    .eq('id', registration.id);

  if (deleteErr) throw new Error(deleteErr.message);

  return {
    message: 'Registration deleted successfully',
    registration_id: registration.id,
  };
};

