import { Express } from 'express';
import { $Enums, PrismaClient, events_info } from '@prisma/client';
import { AuthRequest } from '../auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer for file uploads
const uploadDir = path.join(process.cwd(), 'public/events');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const toEventSlug = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'event';

export const removeUploadedFiles = (files: Express.Multer.File[] = []) => {
    files.forEach((file) => {
        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    });
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const title = String(req.body?.title || 'event');
        const slug = toEventSlug(title);
        const eventDir = path.join(uploadDir, slug);
        if (!fs.existsSync(eventDir)) {
            fs.mkdirSync(eventDir, { recursive: true });
        }
        (req as AuthRequest & { uploadIndex?: number; eventSlug?: string }).eventSlug = slug;
        cb(null, eventDir);
    },
    filename: (req, file, cb) => {
        const typedReq = req as AuthRequest & { uploadIndex?: number };
        const defaultIndex = typedReq.uploadIndex ?? 0;
        const orderMatch = /^(\d+)__/.exec(file.originalname);
        const explicitIndex = orderMatch ? Number.parseInt(orderMatch[1], 10) : Number.NaN;
        const index = Number.isFinite(explicitIndex) ? explicitIndex : defaultIndex;
        const extension = path.extname(file.originalname).toLowerCase();
        typedReq.uploadIndex = defaultIndex + 1;
        cb(null, `${index}${extension}`);
    }
});

export const upload = multer({
    storage,
    // limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        // Only allow images
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF allowed.'));
        }
    }
});

export const fixDateTimeFormat = (event: events_info) => {
    return {
        ...event,
        date: event.date.toISOString().split('T')[0],
        start_time: event.start_time.toISOString().split('T')[1].substring(0, 5),
        end_time: event.end_time.toISOString().split('T')[1].substring(0, 5),
    };
};

export const formatDateTime = (value: Date | null | undefined) => (value ? value.toISOString() : null);

const pad = (value: number) => String(value).padStart(2, '0');

export const parseDateOnly = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const parseTimeOnly = (value: string) => {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
        return null;
    }
    const [hoursString, minutesString, secondsString = '00'] = value.split(':');
    const hours = Number(hoursString);
    const minutes = Number(minutesString);
    const seconds = Number(secondsString);
    const parsed = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const EVENT_INVITATION_MEMBERS_ONLY = 'members';
export const DEFAULT_UNIVERSITY_NAME = 'Lund University';
export const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,14}$/;
export const SCHOOL_TEXT_REGEX = /^[A-Za-z0-9À-ÖØ-öø-ÿ .,'()&+\/-]{2,100}$/;
export const EVENT_REGISTRATION_STATUSES: $Enums.EventRegistrationStatus[] = ['pending', 'confirmed', 'cancelled', 'waitlisted'];
export const FORBIDDEN_REGISTRATION_BODY_KEYS = new Set([
    'event_id',
    'user_id',
    'status',
    'quoted_price',
    'payment_required',
    'invitation_snapshot',
    'siblings_snapshot',
]);

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

export type RegistrationStatusUpdatePayload = {
    registration_id?: string;
    status?: $Enums.EventRegistrationStatus;
};

type EventFormOption = string;

export type EventFormFieldResponse = {
    id: string;
    question: string;
    help_text: string | null;
    field_type: $Enums.EventFormFieldType;
    is_required: boolean;
    options: EventFormOption[];
};

type CreateEventFormFieldPayload = {
    question?: string;
    help_text?: string | null;
    id?: string;
    field_type?: string;
    is_required?: boolean | string;
    options?: unknown;
    sort_order?: number | string;
};

type NormalizedCreateEventFormField = {
    question: string;
    help_text: string | null;
    field_type: $Enums.EventFormFieldType;
    id?: string;
    is_required: boolean;
    sort_order: number;
    options?: EventFormOption[];
};

export const isGender = (value: string): value is $Enums.Gender => value === 'male' || value === 'female';

export const normalizeTrimmed = (value?: string | null) => (typeof value === 'string' ? value.trim() : '');

export const boolOrDefault = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

const parseBooleanValue = (value: unknown, fallback = false) => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') {
            return true;
        }
        if (normalized === 'false' || normalized === '0') {
            return false;
        }
    }
    return fallback;
};

export const normalizeFieldOptions = (value: unknown): EventFormOption[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((option) => {
            if (typeof option === 'string') {
                return normalizeTrimmed(option);
            }
            return null;
        })
        .filter((option): option is EventFormOption => Boolean(option));
};

export const normalizeCreateEventFormFields = (value: unknown): { fields: NormalizedCreateEventFormField[]; error?: string } => {
    if (value === undefined || value === null || value === '') {
        return { fields: [] };
    }

    let parsedValue: unknown = value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return { fields: [] };
        }
        try {
            parsedValue = JSON.parse(trimmed);
        } catch {
            return { fields: [], error: 'Invalid form_fields JSON payload.' };
        }
    }

    if (!Array.isArray(parsedValue)) {
        return { fields: [], error: 'form_fields must be an array.' };
    }

    const normalizedFields: NormalizedCreateEventFormField[] = [];
    const allowedTypes = new Set<$Enums.EventFormFieldType>(['short_text', 'checkbox_multi', 'radio_single']);

    for (let index = 0; index < parsedValue.length; index += 1) {
        const rawField = parsedValue[index] as CreateEventFormFieldPayload;
        if (!rawField || typeof rawField !== 'object') {
            return { fields: [], error: `Invalid form field at index ${index}.` };
        }

        const id = normalizeTrimmed(rawField.id) || undefined;
        const question = normalizeTrimmed(rawField.question);
        if (!question) {
            return { fields: [], error: `Form field question is required at index ${index}.` };
        }

        const fieldTypeRaw = normalizeTrimmed(rawField.field_type);
        if (!allowedTypes.has(fieldTypeRaw as $Enums.EventFormFieldType)) {
            return { fields: [], error: `Invalid form field type at index ${index}.` };
        }
        const field_type = fieldTypeRaw as $Enums.EventFormFieldType;

        const sortOrderValue = typeof rawField.sort_order === 'string' || typeof rawField.sort_order === 'number'
            ? Number(rawField.sort_order)
            : index;
        const sort_order = Number.isNaN(sortOrderValue) ? index : sortOrderValue;

        const rawOptions = normalizeFieldOptions(rawField.options);

        const dedupedOptions: EventFormOption[] = [];
        const seenOptionValues = new Set<string>();
        rawOptions.forEach((option) => {
            if (!seenOptionValues.has(option)) {
                seenOptionValues.add(option);
                dedupedOptions.push(option);
            }
        });

        if (field_type !== 'short_text' && dedupedOptions.length === 0) {
            return { fields: [], error: `Form field options are required for ${field_type} at index ${index}.` };
        }

        normalizedFields.push({
            id,
            question,
            help_text: normalizeTrimmed(rawField.help_text) || null,
            field_type,
            is_required: parseBooleanValue(rawField.is_required, false),
            sort_order,
            options: field_type === 'short_text' ? undefined : dedupedOptions,
        });
    }

    return { fields: normalizedFields };
};

export const getEventFormFields = async (prisma: PrismaClient, eventId: number): Promise<EventFormFieldResponse[]> => {
    const fields = await prisma.event_form_fields.findMany({
        where: { event_id: eventId },
        orderBy: { sort_order: 'asc' },
    });

    return fields.map((field) => ({
        id: field.id,
        question: field.question,
        help_text: field.help_text,
        field_type: field.field_type,
        is_required: field.is_required,
        options: normalizeFieldOptions(field.options),
    }));
};

const formatUtcTimestamp = (date: Date) => {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

const escapeIcsText = (value: string) =>
    value
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');

export const buildIcsPayload = (event: events_info) => {
    const date = event.date;
    const startTime = event.start_time;
    const endTime = event.end_time;

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const startHours = startTime.getUTCHours();
    const startMinutes = startTime.getUTCMinutes();
    const startSeconds = startTime.getUTCSeconds();

    const endHours = endTime.getUTCHours();
    const endMinutes = endTime.getUTCMinutes();
    const endSeconds = endTime.getUTCSeconds();

    const startUtcMs = Date.UTC(year, month, day, startHours, startMinutes, startSeconds);
    let endUtcMs = Date.UTC(year, month, day, endHours, endMinutes, endSeconds);

    if (endUtcMs <= startUtcMs) {
        endUtcMs += 24 * 60 * 60 * 1000;
    }

    const endDate = new Date(endUtcMs);

    const formatFloating = (d: Date) =>
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//LUMS//Events//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:event-${event.id}@lums`,
        `DTSTAMP:${formatUtcTimestamp(new Date())}`,
        `DTSTART:${formatFloating(new Date(startUtcMs))}`,
        `DTEND:${formatFloating(endDate)}`,
        `SUMMARY:${escapeIcsText(event.title)}`,
        event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : '',
        event.address ? `LOCATION:${escapeIcsText(event.address)}` : '',
        'END:VEVENT',
        'END:VCALENDAR',
    ].filter(Boolean);

    return lines.join('\r\n');
};
