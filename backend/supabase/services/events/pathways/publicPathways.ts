import type { Database } from ']/types/types';
import { supabase } from ']/client';
import { fixEventDateTimeFormat, toEventFormFieldResponse } from './shared.ts';

type EventRow = Database['public']['Tables']['events_info']['Row'];
type EventFormFieldRow = Database['public']['Tables']['event_form_fields']['Row'];
type RegistrationStatus = Database['public']['Enums']['EventRegistrationStatus'];

type CurrentEventResponse = EventRow & {
    is_registered: boolean;
};

type EventByIdResponse = CurrentEventResponse & {
    form_fields?: ReturnType<typeof toEventFormFieldResponse>[];
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

const getRegisteredEventIds = async (userId: string, eventIds: number[]) => {
    if (eventIds.length === 0) {
        return new Set<number>();
    }

    const { data: registrations, error: registrationError } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', userId)
        .neq('status', 'cancelled' as RegistrationStatus)
        .in('event_id', eventIds);

    if (registrationError) {
        throw new Error(registrationError.message);
    }

    return new Set((registrations ?? []).map((registration) => registration.event_id));
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
        .select('id,title,date,start_time,end_time,deadline,address,invitation,siblings,price_member,price_nonmember,poster')
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
    const registeredEventIds = user ? await getRegisteredEventIds(user.id, events.map((event) => event.id)) : new Set<number>();

    return events.map((event): CurrentEventResponse => ({
        ...fixEventDateTimeFormat(event),
        is_registered: registeredEventIds.has(event.id),
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
    const registeredEventIds = user ? await getRegisteredEventIds(user.id, events.map((event) => event.id)) : new Set<number>();

    return events.map((event): CurrentEventResponse => ({
        ...fixEventDateTimeFormat(event),
        is_registered: registeredEventIds.has(event.id),
    }));
};

export const fetchEventById = async (eventId: number, includeFormFields = true): Promise<EventByIdResponse> => {
    const { user, event } = await getSingleEventWithAccess(eventId);
    let isRegistered = false;

    if (user) {
        const { data: existing, error: registrationError } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', user.id)
            .neq('status', 'cancelled' as RegistrationStatus)
            .limit(1)
            .maybeSingle();

        if (registrationError) {
            throw new Error(registrationError.message);
        }

        isRegistered = Boolean(existing);
    }

    if (!includeFormFields) {
        return {
            ...fixEventDateTimeFormat(event),
            is_registered: isRegistered,
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
        is_registered: isRegistered,
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
