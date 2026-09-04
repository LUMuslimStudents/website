import {
  authSignupData,
  authLoginData,
  authUserData,
  authSignOutData,
  authForgotPasswordData,
  authVerifyResetData,
  authVerifySignupData,
  authUpdatePasswordData,
  adminUsersData,
  adminUserRegistrationsData,
  adminTreasuryReportData,
  eventData,
  eventPastData,
  eventByIdData,
  eventIcsData,
  eventRegisterData,
  adminEventsData,
  adminEventDetailData,
  adminEventsWithRegistrationsData,
  adminCreateEventData,
  adminUpdateEventData,
  adminUpdateEventPublishStateData,
  adminUpdateRegistrationStatusesData,
  adminDeleteRegistrationData,
  adminOptionsData,
  adminOptionsCurrentData,
  adminOptionsUpsertData,
  adminUpdateEventOpenStateData,
  membershipStatusData,
  membershipCheckoutData,
  membershipCancelData,
  eventCheckoutData,
  eventCancellationData,
  donationCheckoutData,
  paymentVerifyData,
} from ']/SupabaseSource';
import { supabase } from ']/client';

// ── Helpers ─────────────────────────────────────────────────────────────────

const normalizeMarkdownEscapes = (text: string | null | undefined): string | null | undefined => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\\\\r\\\\n/g, '\\n')
    .replace(/\\\\n/g, '\\n')
    .replace(/\\\\t/g, '\\t')
    .replace(/\\r\\n/g, '\\n')
    .replace(/\\n/g, '\\n')
    .replace(/\\t/g, '\\t');
};

const normalizeEventData = (data: any): any => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(normalizeEventData);
  if (typeof data === 'object') {
    const normalized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'description' && typeof value === 'string') {
        normalized[key] = normalizeMarkdownEscapes(value);
      } else if (typeof value === 'object') {
        normalized[key] = normalizeEventData(value);
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  }
  return data;
};

const getQueryParam = (endpoint: string, key: string) => {
  const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
  return new URLSearchParams(queryString).get(key);
};

// ── FormData helpers ────────────────────────────────────────────────────────

const toEventSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'event';

/**
 * Storage slug for an event's poster folder in the `events` bucket:
 * "{term}-{event-slug}". Events are namespaced by term so poster folders
 * never collide across terms (e.g. "ht26-summer-event"). Falls back to the
 * title-only slug when no term is known (legacy events).
 */
const toEventStorageSlug = (term: string | null | undefined, title: string) => {
  const termPart = toEventSlug(term ?? '');
  const titlePart = toEventSlug(title || 'event');
  return termPart ? `${termPart}-${titlePart}` : titlePart;
};

const parseFormDataPayload = async (
  formData: FormData,
): Promise<{ payload: Record<string, any>; files: File[] }> => {
  const payload: Record<string, any> = {};
  const files: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files.push(value);
    } else if (key === 'form_fields') {
      try {
        payload.form_fields = JSON.parse(value as string);
      } catch {
        payload.form_fields = [];
      }
    } else if (key === 'publish_mode') {
      payload.is_published = (value as string).toLowerCase() !== 'draft';
    } else {
      payload[key] = value;
    }
  }

  return { payload, files };
};

/**
 * Re-encodes a poster image to WebP (and caps its longest edge) before it is
 * uploaded, to keep bucket storage usage small. Returns null when the file
 * can't be decoded/encoded (e.g. unsupported format) — callers then fall back
 * to uploading the original bytes under their original extension.
 */
const POSTER_WEBP_QUALITY = 0.82;
/** Longest edge (px) that uploaded posters are scaled down to. */
const POSTER_MAX_DIMENSION = 2000;

const convertImageToWebP = (file: File): Promise<Blob | null> =>
  new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    image.onload = () => {
      try {
        const scale = Math.min(
          1,
          POSTER_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
        );
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          cleanup();
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            resolve(blob);
          },
          'image/webp',
          POSTER_WEBP_QUALITY,
        );
      } catch {
        cleanup();
        resolve(null);
      }
    };

    image.onerror = () => {
      cleanup();
      resolve(null);
    };

    image.src = objectUrl;
  });

const uploadPosterToStorage = async (slug: string, files: File[]): Promise<string | null> => {
  if (files.length === 0) return null;

  for (let i = 0; i < files.length; i++) {
    // Convert every poster to WebP first — readers probe ".webp" before the
    // legacy formats, so new folders only ever contain one file per slide.
    // If encoding fails or doesn't actually save space, upload the original.
    const original = files[i];
    const converted = await convertImageToWebP(original);
    const useConverted = converted !== null && converted.size < original.size;

    const path = useConverted
      ? `${slug}/${i}.webp`
      : `${slug}/${i}.${original.name.split('.').pop()?.toLowerCase() || 'jpg'}`;

    const { error } = await supabase.storage
      .from('events')
      .upload(path, useConverted ? converted : original, {
        upsert: true,
        ...(useConverted ? { contentType: 'image/webp' } : {}),
      });

    if (error) throw new Error(`Image upload failed: ${error.message}`);
  }

  return slug;
};

const resolvePosterUrl = (poster: string | null): string | null => {
  if (!poster) return null;
  // Already a full URL (from legacy REST API events)
  if (poster.startsWith('http://') || poster.startsWith('https://')) return poster;
  // Already a path with leading slash (from REST API)
  if (poster.startsWith('/')) return poster;
  // Plain slug — resolve via Supabase Storage
  const { data } = supabase.storage.from('events').getPublicUrl(`${poster}/0.jpg`);
  return data.publicUrl.replace(/\/0\.jpg$/, '');
};

const normalizePosters = (data: any): any => {
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item?.poster) item.poster = resolvePosterUrl(item.poster as string) ?? item.poster;
    }
  } else if (data?.poster) {
    data.poster = resolvePosterUrl(data.poster as string) ?? data.poster;
  }
  return data;
};

// ── Router ──────────────────────────────────────────────────────────────────

export const SupabaseRequest = async (
  endpoint: string,
  method: string = 'GET',
  body?: any,
) => {
  // ── Auth: Signup ────────────────────────────────────────────────
  if (endpoint === '/auth/signup' && method === 'POST') {
    return authSignupData(body);
  }

  // ── Auth: Login ─────────────────────────────────────────────────
  if (endpoint === '/auth/login' && method === 'POST') {
    return authLoginData(body?.email, body?.password);
  }

  // ── Auth: Current user ──────────────────────────────────────────
  if (endpoint === '/auth/user' && method === 'GET') {
    return authUserData();
  }

  // ── Auth: Sign out ──────────────────────────────────────────────
  if (endpoint === '/auth/signout' && method === 'POST') {
    return authSignOutData();
  }

  // ── Auth: Forgot password (request reset link) ──────────────────
  if (endpoint === '/auth/forgot-password' && method === 'POST') {
    const redirectTo = body?.redirectTo || `${window.location.origin}/reset-password`;
    return authForgotPasswordData(body?.email, redirectTo);
  }

  // ── Auth: Verify reset token (PKCE callback) ────────────────────
  if (endpoint === '/auth/verify-reset' && method === 'POST') {
    const redirectTo = body?.redirectTo || `${window.location.origin}/reset-password`;
    return authVerifyResetData(body?.token_hash, redirectTo);
  }

  // ── Auth: Verify signup confirmation link (PKCE) ────────────────
  if (endpoint === '/auth/verify-signup' && method === 'POST') {
    return authVerifySignupData(body?.token_hash);
  }

  // ── Auth: Update password (after reset) ─────────────────────────
  if (endpoint === '/auth/update-password' && method === 'POST') {
    return authUpdatePasswordData(body?.password);
  }

  // ── Admin: List users ───────────────────────────────────────────
  if (endpoint === '/admin/users' && method === 'GET') {
    return adminUsersData();
  }

  // ── Admin: Single user's event registrations ──────────────────
  if (endpoint.startsWith('/admin/user-registrations')) {
    const userId = getQueryParam(endpoint, 'user_id');
    if (!userId) throw new Error('User id required');
    return adminUserRegistrationsData(userId);
  }

  // ── Admin: Treasurer income report ────────────────────────────
  if (endpoint.startsWith('/admin/treasury-report')) {
    const term = getQueryParam(endpoint, 'term');
    return adminTreasuryReportData(term || null);
  }

  // ── Events ──────────────────────────────────────────────────────
  if (endpoint === '/events/current-events') {
    return normalizeEventData(normalizePosters(await eventData()));
  }

  if (endpoint === '/events/past-events') {
    return normalizeEventData(normalizePosters(await eventPastData()));
  }

  if (endpoint.startsWith('/events/event-by-id')) {
    const id = Number(getQueryParam(endpoint, 'id'));
    if (!Number.isInteger(id)) throw new Error('Event id required');
    const includeFormFields = getQueryParam(endpoint, 'include_form_fields') !== 'false';
    return normalizeEventData(normalizePosters(await eventByIdData(id, includeFormFields)));
  }

  const icsMatch = endpoint.match(/^\/events\/(\d+)\/ics$/);
  if (icsMatch) {
    const eventId = Number(icsMatch[1]);
    return eventIcsData(eventId);
  }

  // ── Event Registration ─────────────────────────────────────────
  const registerMatch = endpoint.match(/^\/events\/(\d+)\/register$/);
  if (registerMatch && method === 'POST') {
    const eventId = Number(registerMatch[1]);
    return eventRegisterData(eventId, body?.profile, body?.answers);
  }

  // ── Admin: List events ─────────────────────────────────────────
  if (endpoint === '/admin/events' && method === 'GET') {
    return normalizeEventData(normalizePosters(await adminEventsData()));
  }

  // ── Admin: Events with registrations ───────────────────────────
  if (endpoint === '/admin/events-with-registrations' && method === 'GET') {
    return normalizeEventData(normalizePosters(await adminEventsWithRegistrationsData()));
  }

  // ── Admin: Create event ────────────────────────────────────────
  if (endpoint === '/admin/create-event' && method === 'POST') {
    if (body instanceof FormData) {
      const { payload, files } = await parseFormDataPayload(body);
      // New events always belong to the current term (the create pathway
      // resolves the very same term server-side), so posters are stored
      // under "{term}-{event-slug}" to keep folders unique across terms.
      const currentOptions = await adminOptionsCurrentData();
      const slug = toEventStorageSlug(currentOptions?.term, payload.title || 'event');
      const poster = await uploadPosterToStorage(slug, files);
      const result = await adminCreateEventData({ ...payload, poster: slug });
      return { ...result, event: { ...result.event, poster: resolvePosterUrl(poster) } };
    }
    return adminCreateEventData(body);
  }

  // ── Admin: Get / Update / Delete event ─────────────────────────
  const adminEventMatch = endpoint.match(/^\/admin\/events\/(\d+)$/);
  if (adminEventMatch) {
    const eventId = Number(adminEventMatch[1]);
    if (method === 'GET') {
      return normalizeEventData(normalizePosters(await adminEventDetailData(eventId)));
    }
    if (method === 'PATCH') {
      if (body instanceof FormData) {
        const { payload, files } = await parseFormDataPayload(body);
        let poster: string | undefined;
        if (files.length > 0) {
          // Use the event's own term (an event can be edited long after its
          // term stopped being current) so its poster folder stays
          // consistent with the term-scoped naming scheme.
          const existing = await adminEventDetailData(eventId);
          const slug = toEventStorageSlug(existing?.term, payload.title || 'event');
          poster = await uploadPosterToStorage(slug, files);
        }
        return adminUpdateEventData(eventId, { ...payload, ...(poster ? { poster } : {}) });
      }
      return adminUpdateEventData(eventId, body);
    }
  }

  // ── Admin: Publish state ───────────────────────────────────────
  const publishMatch = endpoint.match(/^\/admin\/events\/(\d+)\/publish-state$/);
  if (publishMatch && method === 'PATCH') {
    const eventId = Number(publishMatch[1]);
    return adminUpdateEventPublishStateData(eventId, body?.is_published);
  }

  // ── Admin: Signup open state ───────────────────────────────────
  const openStateMatch = endpoint.match(/^\/admin\/events\/(\d+)\/open-state$/);
  if (openStateMatch && method === 'PATCH') {
    const eventId = Number(openStateMatch[1]);
    return adminUpdateEventOpenStateData(eventId, body?.is_open);
  }

  // ── Admin: Update registration statuses ────────────────────────
  const regStatusMatch = endpoint.match(
    /^\/admin\/events\/(\d+)\/registrations\/status$/,
  );
  if (regStatusMatch && method === 'PATCH') {
    const eventId = Number(regStatusMatch[1]);
    return adminUpdateRegistrationStatusesData(eventId, body?.updates);
  }

  // ── Admin: Delete registration ─────────────────────────────────
  const regDeleteMatch = endpoint.match(
    /^\/admin\/events\/(\d+)\/registrations\/([a-f0-9-]+)$/,
  );
  if (regDeleteMatch && method === 'DELETE') {
    const eventId = Number(regDeleteMatch[1]);
    const registrationId = regDeleteMatch[2];
    return adminDeleteRegistrationData(eventId, registrationId);
  }

  // ── Admin: Get options ──────────────────────────────────────────
  if (endpoint === '/admin/options' && method === 'GET') {
    return adminOptionsData();
  }

  // ── Admin: Upsert options ───────────────────────────────────────
  if (endpoint === '/admin/options' && method === 'PUT') {
    return adminOptionsUpsertData(body);
  }
// ── Public: Get current term options ────────────────────────────
  if (endpoint === '/options/current' && method === 'GET') {
    return adminOptionsCurrentData();
  }
  // ── Membership status (login gate + membership page) ───────────
  if (endpoint === '/membership/status' && method === 'GET') {
    return membershipStatusData();
  }

  // ── Membership checkout → Stripe hosted page ───────────────────
  if (endpoint === '/membership/checkout' && method === 'POST') {
    return membershipCheckoutData(body?.plan);
  }

  // ── Membership cancel (checkout page → delete account) ──────────
  if (endpoint === '/membership/cancel' && method === 'POST') {
    return membershipCancelData();
  }

  // ── Event registration checkout → Stripe hosted page ───────────
  const eventCheckoutMatch = endpoint.match(/^\/events\/(\d+)\/checkout$/);
  if (eventCheckoutMatch && method === 'POST') {
    return eventCheckoutData(body?.registration_id);
  }

  // ── Donation checkout → Stripe hosted page ─────────────────────
  if (endpoint === '/donations/checkout' && method === 'POST') {
    return donationCheckoutData(body?.amount);
  }

  // ── Cancel pending event registration ──────────────────────────
  const cancelRegistrationMatch = endpoint.match(
    /^\/events\/(\d+)\/cancel-registration$/,
  );
  if (cancelRegistrationMatch && method === 'POST') {
    return eventCancellationData(body?.registration_id);
  }

  // ── Verify payment (success page) ──────────────────────────────
  if (endpoint.startsWith('/payment/verify') && method === 'GET') {
    const sessionId = getQueryParam(endpoint, 'session_id');
    if (!sessionId) throw new Error('session_id is required');
    return paymentVerifyData(sessionId);
  }
  
  throw new Error('API request invalid');
};
