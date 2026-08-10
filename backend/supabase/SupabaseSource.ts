import {
  getCurrentEvents,
  getEventById,
  getEventIcs,
  getPastEvents,
  registerForEvent,
  adminListEvents,
  adminGetEvent,
  adminListEventsWithRegistrations,
  adminCreateEvent,
  adminUpdateEvent,
  adminUpdateEventPublishState,
  adminUpdateRegistrationStatuses,
  adminDeleteRegistration,
} from ']/services/events/events';
import {
  signup,
  login,
  requestPasswordReset,
  verifyResetToken,
  updatePassword,
  getCurrentUser,
  signOut,
  getUsers,
} from ']/services/accounts/accounts';
import {
  getAdminOptions,
  getCurrentAdminOptions,
  upsertAdminOptions,
} from ']/services/adminOptions/adminOptions';

// ── Event data exports ──────────────────────────────────────────────────────

export const eventData = async () => getCurrentEvents();
export const eventPastData = async () => getPastEvents();
export const eventByIdData = async (eventId: number, includeFormFields = true) =>
  getEventById(eventId, includeFormFields);
export const eventIcsData = async (eventId: number) => getEventIcs(eventId);

// ── Signup exports ──────────────────────────────────────────────────────────

export const authSignupData = async (input: Parameters<typeof signup>[0]) =>
  signup(input);

// ── Auth exports ────────────────────────────────────────────────────────────

export const authLoginData = async (email: string, password: string) =>
  login(email, password);

export const authUserData = async () => getCurrentUser();

export const authSignOutData = async () => signOut();

// ── Password reset exports ──────────────────────────────────────────────────

export const authForgotPasswordData = async (email: string, redirectTo: string) =>
  requestPasswordReset(email, redirectTo);

export const authVerifyResetData = async (token_hash: string, redirectTo: string) =>
  verifyResetToken(token_hash, redirectTo);

export const authUpdatePasswordData = async (password: string) =>
  updatePassword(password);

// ── Admin exports ───────────────────────────────────────────────────────────

export const adminUsersData = async () => getUsers();

// ── Event registration exports ─────────────────────────────────────────────

export const eventRegisterData = async (
  eventId: number,
  profile: Parameters<typeof registerForEvent>[1],
  answers: Parameters<typeof registerForEvent>[2],
) => registerForEvent(eventId, profile, answers);

// ── Admin event exports ────────────────────────────────────────────────────

export const adminEventsData = async () => adminListEvents();

export const adminEventDetailData = async (eventId: number) =>
  adminGetEvent(eventId);

export const adminEventsWithRegistrationsData = async () =>
  adminListEventsWithRegistrations();

export const adminCreateEventData = async (
  input: Parameters<typeof adminCreateEvent>[0],
) => adminCreateEvent(input);

export const adminUpdateEventData = async (
  eventId: number,
  input: Parameters<typeof adminUpdateEvent>[1],
) => adminUpdateEvent(eventId, input);

export const adminUpdateEventPublishStateData = async (
  eventId: number,
  isPublished: boolean,
) => adminUpdateEventPublishState(eventId, isPublished);

export const adminUpdateRegistrationStatusesData = async (
  eventId: number,
  updates: Parameters<typeof adminUpdateRegistrationStatuses>[1],
) => adminUpdateRegistrationStatuses(eventId, updates);

export const adminDeleteRegistrationData = async (
  eventId: number,
  registrationId: string,
) => adminDeleteRegistration(eventId, registrationId);

// ── Admin options exports ───────────────────────────────────────────────────

export const adminOptionsData = async () => getAdminOptions();

export const adminOptionsCurrentData = async () => getCurrentAdminOptions();

export const adminOptionsUpsertData = async (
  input: Parameters<typeof upsertAdminOptions>[0],
) => upsertAdminOptions(input);
