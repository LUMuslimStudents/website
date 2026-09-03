import type { Database } from ']/types/types';
import { supabase } from ']/client';
import { fixEventDateTimeFormat, toEventFormFieldResponse } from './shared.ts';

type EventRow = Database['public']['Tables']['events_info']['Row'];
type EventFormFieldRow = Database['public']['Tables']['event_form_fields']['Row'];
type RegistrationStatus = Database['public']['Enums']['EventRegistrationStatus'];

type CurrentEventResponse = EventRow & {
    is_registered: boolean;
    is_pending_payment: boolean;
    pending_registration_id: string | null;
};

type EventByIdResponse = CurrentEventResponse & {
    form_fields?: ReturnType<typeof toEventFormFieldResponse>[];
};

/**
 * Registration state for one user + one event. A registration only counts as
 * "real" once it's paid (or when no payment is required). Unpaid paid-event
 * rows are drafts: invisible everywhere except as a "complete your payment"
 * prompt. The status field stays admin-driven (seat tracker) — payment state
 * lives in payment_status.
 */
type RegistrationState = {
    is_registered: boolean;
    is_pending_payment: boolean;
    pending_registration_id: string | null;
};

const NO_REGISTRATION: RegistrationState = {
    is_registered: false,
    is_pending_payment: false,
    pending_registration_id: null,
};

const getOptionalUser = async () => {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError && !/Auth session missing/i.test(userError.message)) {
        throw new Error(userError.message);
    }

    return user;
};

/** True only for fully signed-up members (not anonymous). */
const isMember = (user: { is_anonymous?: boolean } | null) =>
    user !== null && !user.is_anonymous;

const getRegistrationStates = async (
    userId: string,
    eventIds: number[],
): Promise<Map<number, RegistrationState>> => {
    const states = new Map<number, RegistrationState>();
    if (eventIds.length === 0) {
        return states;
    }

    const { data: registrations, error: registrationError } = await supabase
        .from('event_registrations')
        .select('event_id, id, payment_required, transaction:transactions(payment_status)')
        .eq('user_id', userId)
        .neq('status', 'cancelled' as RegistrationStatus)
        .in('event_id', eventIds);

    if (registrationError) {
        throw new Error(registrationError.message);
    }

    for (const registration of registrations ?? []) {
        const isReal =
            !registration.payment_required || registration.transaction?.payment_status === 'paid';
        states.set(registration.event_id, {
            is_registered: isReal,
            is_pending_payment: !isReal,
            pending_registration_id: isReal ? null : registration.id,
        });
    }

    return states;
};

const getSingleEventWithAccess = async (eventId: number) => {
    const user = await getOptionalUser();
    const { data: event, error } = await supabase
        .from('events_info')
        .select('*')
        .eq('id', eventId)
        .single();

    if (error || !event || event.is_published === false) {
        throw new Error('Event id does not exist in DB.');
    }

    if (!isMember(user) && event.invitation === 'members') {
        throw new Error('Access denied.');
    }

    return { user, event: event as EventRow };
};

export const fetchCurrentEvents = async () => {
    const user = await getOptionalUser();

    const today = new Date().toISOString().split('T')[0];

    let eventsQuery = supabase
        .from('events_info')
        .select('id,title,date,start_time,end_time,deadline,address,invitation,siblings,price_member,price_nonmember,poster,is_open')
        .eq('is_published', true)
        .gte('date', today)
        .order('date', { ascending: false });

    if (!isMember(user)) {
        eventsQuery = eventsQuery.neq('invitation', 'members');
    }

    const { data, error } = await eventsQuery;

    if (error) {
        throw new Error(error.message);
    }

    const events = (data ?? []) as EventRow[];
    const registrationStates = user
        ? await getRegistrationStates(user.id, events.map((event) => event.id))
        : new Map<number, RegistrationState>();

    return events.map((event): CurrentEventResponse => ({
        ...fixEventDateTimeFormat(event),
        ...(registrationStates.get(event.id) ?? NO_REGISTRATION),
    }));
};

export const fetchPastEvents = async () => {
    const user = await getOptionalUser();
    const nowIso = new Date().toISOString();

    let eventsQuery = supabase
        .from('events_info')
        .select('*')
        .eq('is_published', true)
        .lt('deadline', nowIso)
        .order('deadline', { ascending: false });

    if (!isMember(user)) {
        eventsQuery = eventsQuery.neq('invitation', 'members');
    }

    const { data, error } = await eventsQuery;
    if (error) {
        throw new Error(error.message);
    }

    const events = (data ?? []) as EventRow[];
    const registrationStates = user
        ? await getRegistrationStates(user.id, events.map((event) => event.id))
        : new Map<number, RegistrationState>();

    return events.map((event): CurrentEventResponse => ({
        ...fixEventDateTimeFormat(event),
        ...(registrationStates.get(event.id) ?? NO_REGISTRATION),
    }));
};

export const fetchEventById = async (eventId: number, includeFormFields = true): Promise<EventByIdResponse> => {
    const { user, event } = await getSingleEventWithAccess(eventId);
    let registrationState: RegistrationState = NO_REGISTRATION;

    if (user) {
        const { data: existing, error: registrationError } = await supabase
            .from('event_registrations')
            .select('id, payment_required, transaction:transactions(payment_status)')
            .eq('event_id', event.id)
            .eq('user_id', user.id)
            .neq('status', 'cancelled' as RegistrationStatus)
            .limit(1)
            .maybeSingle();

        if (registrationError) {
            throw new Error(registrationError.message);
        }

        if (existing) {
            const isReal =
                !existing.payment_required || existing.transaction?.payment_status === 'paid';
            registrationState = {
                is_registered: isReal,
                is_pending_payment: !isReal,
                pending_registration_id: isReal ? null : existing.id,
            };
        }
    }

    if (!includeFormFields) {
        return {
            ...fixEventDateTimeFormat(event),
            ...registrationState,
        };
    }

    const { data: fields, error: fieldsError } = await supabase
        .from('event_form_fields')
        .select('*')
        .eq('event_id', event.id)
        .order('sort_order', { ascending: true });

    if (fieldsError) {
        throw new Error(fieldsError.message);
    }

    return {
        ...fixEventDateTimeFormat(event),
        form_fields: ((fields ?? []) as EventFormFieldRow[]).map(toEventFormFieldResponse),
        ...registrationState,
    };
};

export const fetchEventIcs = async (eventId: number): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('events-ics', {
        body: { eventId },
    });

    if (error) {
        throw new Error(error.message);
    }

    if (typeof data === 'string') {
        return data;
    }

    if (data && typeof data === 'object' && typeof (data as { ics?: unknown }).ics === 'string') {
        return (data as { ics: string }).ics;
    }

    throw new Error('Invalid ICS response payload');
};
