import { fetchCurrentEvents, fetchEventById, fetchEventIcs, fetchPastEvents } from './pathways/publicPathways';
import { submitRegistration } from './pathways/registrationPathways';
import {
  getAdminEvents,
  getAdminEventById,
  getAdminEventsWithRegistrations,
  createEvent,
  updateEvent,
  updateEventPublishState,
  updateRegistrationStatuses,
  deleteRegistration,
} from './pathways/adminPathways';

// ── Public exports ──────────────────────────────────────────────────────────

export const getCurrentEvents = async () => {
    return fetchCurrentEvents();
};

export const getPastEvents = async () => {
    return fetchPastEvents();
};

export const getEventById = async (eventId: number, includeFormFields = true) => {
    return fetchEventById(eventId, includeFormFields);
};

export const getEventIcs = async (eventId: number) => {
    return fetchEventIcs(eventId);
};

// ── Registration exports ───────────────────────────────────────────────────

export const registerForEvent = async (
  eventId: number,
  profile: Parameters<typeof submitRegistration>[1],
  answers: Parameters<typeof submitRegistration>[2],
) => {
  return submitRegistration(eventId, profile, answers);
};

// ── Admin exports ──────────────────────────────────────────────────────────

export const adminListEvents = async () => getAdminEvents();

export const adminGetEvent = async (eventId: number) => getAdminEventById(eventId);

export const adminListEventsWithRegistrations = async () =>
  getAdminEventsWithRegistrations();

export const adminCreateEvent = async (
  input: Parameters<typeof createEvent>[0],
) => createEvent(input);

export const adminUpdateEvent = async (
  eventId: number,
  input: Parameters<typeof updateEvent>[1],
) => updateEvent(eventId, input);

export const adminUpdateEventPublishState = async (
  eventId: number,
  isPublished: boolean,
) => updateEventPublishState(eventId, isPublished);

export const adminUpdateRegistrationStatuses = async (
  eventId: number,
  updates: Parameters<typeof updateRegistrationStatuses>[1],
) => updateRegistrationStatuses(eventId, updates);

export const adminDeleteRegistration = async (
  eventId: number,
  registrationId: string,
) => deleteRegistration(eventId, registrationId);
