import { Express } from 'express';
import { $Enums, PrismaClient, events_info } from '@prisma/client';
import { authenticateToken, authenticateTokenOptional, requireAdmin, AuthRequest } from './auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer for file uploads
const uploadDir = path.join(process.cwd(), 'public/events');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const toEventSlug = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'event';

const removeUploadedFiles = (files: Express.Multer.File[] = []) => {
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
        const index = typedReq.uploadIndex ?? 0;
        const extension = path.extname(file.originalname).toLowerCase();
        typedReq.uploadIndex = index + 1;
        cb(null, `${index}${extension}`);
    }
});

const upload = multer({
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

const fixDateTimeFormat = (event: events_info) => {
    return {
        ...event,
        date: event.date.toISOString().split('T')[0],
        start_time: event.start_time.toISOString().split('T')[1].substring(0, 5),
        end_time: event.end_time.toISOString().split('T')[1].substring(0, 5),
    };
};

const formatDateTime = (value: Date | null | undefined) => (value ? value.toISOString() : null);

const pad = (value: number) => String(value).padStart(2, '0');

const parseDateOnly = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseTimeOnly = (value: string) => {
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

const EVENT_INVITATION_MEMBERS_ONLY = 'members';
const DEFAULT_UNIVERSITY_NAME = 'Lund University';
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,14}$/;
const SCHOOL_TEXT_REGEX = /^[A-Za-z0-9À-ÖØ-öø-ÿ .,'()&+\/-]{2,100}$/;

type RegistrationProfilePayload = {
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

type RegistrationAnswerPayload = {
    field_id: string;
    short_text_value?: string;
    selected_option_value?: string;
    selected_options_json?: string[];
};

type EventFormOption = {
    value: string;
    label: string;
};

type EventFormFieldResponse = {
    id: string;
    label: string;
    help_text: string | null;
    field_type: $Enums.EventFormFieldType;
    is_required: boolean;
    options: EventFormOption[];
};

const isGender = (value: string): value is $Enums.Gender => value === 'male' || value === 'female';

const normalizeTrimmed = (value?: string | null) => (typeof value === 'string' ? value.trim() : '');

const boolOrDefault = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

const normalizeFieldOptions = (value: unknown): EventFormOption[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((option) => {
            if (!option || typeof option !== 'object') {
                return null;
            }

            const rawValue = (option as { value?: unknown }).value;
            const rawLabel = (option as { label?: unknown }).label;
            if (typeof rawValue !== 'string' || typeof rawLabel !== 'string') {
                return null;
            }

            return {
                value: rawValue,
                label: rawLabel,
            };
        })
        .filter((option): option is EventFormOption => option !== null);
};

const getActiveEventFormFields = async (prisma: PrismaClient, eventId: number): Promise<EventFormFieldResponse[]> => {
    const fields = await prisma.event_form_fields.findMany({
        where: { event_id: eventId, active: true },
        orderBy: { sort_order: 'asc' },
    });

    return fields.map((field) => ({
        id: field.id,
        label: field.label,
        help_text: field.help_text,
        field_type: field.field_type,
        is_required: field.is_required,
        options: normalizeFieldOptions(field.options_json),
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

const buildIcsPayload = (event: events_info) => {
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

export function setupEventRoutes(app: Express, prisma: PrismaClient) {
    
    // POST /api/admin/create-event - Create event with image upload (Admin only)
    app.post('/api/admin/create-event', authenticateToken, requireAdmin, upload.array('image', 10), async (req: AuthRequest, res) => {
        try {
            const { title, date, start_time, end_time, deadline, address, invitation, siblings, price_member, price_nonmember, price_alumnus, description } = req.body;
            const term = process.env.MEMBERSHIP_TERM || 'XXXX';
            const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
            const eventSlug = (req as AuthRequest & { eventSlug?: string }).eventSlug || toEventSlug(String(title || 'event'));

            // Validate required fields
            if (!title || !date || !start_time || !end_time || !deadline || !address) {
                removeUploadedFiles(files);
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const parsedDate = parseDateOnly(String(date));
            const parsedStartTime = parseTimeOnly(String(start_time));
            const parsedEndTime = parseTimeOnly(String(end_time));
            const parsedDeadline = new Date(String(deadline));

            if (!parsedDate || !parsedStartTime || !parsedEndTime || Number.isNaN(parsedDeadline.getTime())) {
                removeUploadedFiles(files);
                return res.status(400).json({
                    error: 'Invalid date/time format. Use YYYY-MM-DD for date, HH:MM for time, and ISO datetime for deadline.'
                });
            }

            try {
                // Create event
                const event = await prisma.events_info.create({
                    data: {
                        term,
                        title,
                        date: parsedDate,
                        start_time: parsedStartTime,
                        end_time: parsedEndTime,
                        deadline: parsedDeadline,
                        address,
                        invitation: invitation || 'members',
                        siblings: siblings || 'all',
                        price_member: parseInt(price_member) || 0,
                        price_nonmember: parseInt(price_nonmember) || 0,
                        price_alumnus: parseInt(price_alumnus) || 0,
                        description: description || null,
                        poster: `events/${eventSlug}`, // Store relative path
                    }
                });

                res.status(201).json({
                    message: 'Event created successfully',
                    event: {
                        ...event,
                        date: event.date.toISOString().split('T')[0],
                        start_time: event.start_time.toISOString().split('T')[1].substring(0, 5),
                        end_time: event.end_time.toISOString().split('T')[1].substring(0, 5),
                    }
                });
            } catch (dbError) {
                // Clean up uploaded file on database error
                removeUploadedFiles(files);
                throw dbError;
            }

            console.log("POST: /admin/create-event");
        } catch (error) {
            console.error('Create event error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/events/current-events
    app.get('/api/events/current-events', authenticateTokenOptional, async (req: AuthRequest, res) => {
        try {
            const isLoggedIn = Boolean(req.user);
            const events = await prisma.events_info.findMany({
                where: {
                    deadline: { gte: new Date() },
                    ...(isLoggedIn ? {} : { invitation: { not: 'members' } })
                },
                orderBy: { deadline: 'desc' }
            });

            let registeredEventIds = new Set<number>();
            if (req.user?.id && events.length > 0) {
                const registrations = await prisma.event_registrations.findMany({
                    where: {
                        user_id: BigInt(req.user.id),
                        status: { not: 'cancelled' },
                        event_id: { in: events.map((event) => event.id) },
                    },
                    select: { event_id: true },
                });
                registeredEventIds = new Set(registrations.map((registration) => registration.event_id));
            }

            res.json(events.map((event) => ({
                ...fixDateTimeFormat(event),
                is_registered: registeredEventIds.has(event.id),
            })));
            // res.json(events);

            console.log("GET: /events/current-events");
        } catch (error) {
            console.error('Get current events error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/events/past-events
    app.get('/api/events/past-events', authenticateTokenOptional, async (req: AuthRequest, res) => {
        try {
            const isLoggedIn = Boolean(req.user);
            const events = await prisma.events_info.findMany({
                where: {
                    deadline: { lt: new Date() },
                    ...(isLoggedIn ? {} : { invitation: { not: 'members' } })
                },
                orderBy: { deadline: 'desc' }
            });

            let registeredEventIds = new Set<number>();
            if (req.user?.id && events.length > 0) {
                const registrations = await prisma.event_registrations.findMany({
                    where: {
                        user_id: BigInt(req.user.id),
                        status: { not: 'cancelled' },
                        event_id: { in: events.map((event) => event.id) },
                    },
                    select: { event_id: true },
                });
                registeredEventIds = new Set(registrations.map((registration) => registration.event_id));
            }

            res.json(events.map((event) => ({
                ...fixDateTimeFormat(event),
                is_registered: registeredEventIds.has(event.id),
            })));
            // res.json(events);

            console.log("GET: /events/past-events");
        } catch (error) {
            console.error('Get current events error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/admin/events-with-registrations - Admin only
    app.get('/api/admin/events-with-registrations', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
        try {
            const events = await prisma.events_info.findMany({
                orderBy: { deadline: 'desc' },
                include: {
                    registrations: {
                        where: { status: { not: 'cancelled' } },
                        orderBy: { submitted_at: 'desc' },
                        include: {
                            profile: true,
                            answers: {
                                orderBy: { created_at: 'asc' },
                                include: {
                                    field: {
                                        select: {
                                            id: true,
                                            label: true,
                                            field_type: true,
                                            help_text: true,
                                            is_required: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            const userIds = Array.from(
                new Set(
                    events
                        .flatMap((event) => event.registrations.map((registration) => registration.user_id))
                        .filter((userId): userId is bigint => userId !== null)
                )
            );

            const linkedUsers = userIds.length > 0
                ? await prisma.users.findMany({
                    where: { id: { in: userIds } },
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        role: true,
                        gender: true,
                        study_program: true,
                        phone_number: true,
                        term: true,
                        created_at: true,
                    },
                })
                : [];

            const linkedUserMap = new Map(linkedUsers.map((user) => [String(user.id), user]));

            res.json(events.map((event) => ({
                ...fixDateTimeFormat(event),
                registrations: event.registrations.map((registration) => ({
                    ...registration,
                    submitted_at: formatDateTime(registration.submitted_at),
                    updated_at: formatDateTime(registration.updated_at),
                    linked_user: registration.user_id ? linkedUserMap.get(String(registration.user_id)) ?? null : null,
                    profile: registration.profile,
                    answers: registration.answers.map((answer) => ({
                        ...answer,
                        created_at: formatDateTime(answer.created_at),
                    })),
                })),
            })));

            console.log('GET: /admin/events-with-registrations');
        } catch (error) {
            console.error('Get admin events with registrations error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/admin/events - Admin only
    app.get('/api/admin/events', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
        try {
            const events = await prisma.events_info.findMany({
                orderBy: { deadline: 'desc' },
                include: {
                    registrations: {
                        where: { status: { not: 'cancelled' } },
                        select: { id: true },
                    },
                },
            });

            res.json(events.map((event) => ({
                ...fixDateTimeFormat(event),
                registration_count: event.registrations.length,
            })));

            console.log('GET: /admin/events');
        } catch (error) {
            console.error('Get admin events summary error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/admin/events/:id - Admin only
    app.get('/api/admin/events/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: 'Invalid event id' });
            }

            const event = await prisma.events_info.findUnique({
                where: { id },
                include: {
                    registrations: {
                        where: { status: { not: 'cancelled' } },
                        orderBy: { submitted_at: 'desc' },
                        include: {
                            profile: true,
                            answers: {
                                orderBy: { created_at: 'asc' },
                                include: {
                                    field: {
                                        select: {
                                            id: true,
                                            label: true,
                                            field_type: true,
                                            help_text: true,
                                            is_required: true,
                                            sort_order: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    form_fields: {
                        where: { active: true },
                        orderBy: { sort_order: 'asc' },
                        select: {
                            id: true,
                            label: true,
                            field_type: true,
                            help_text: true,
                            is_required: true,
                            sort_order: true,
                        },
                    },
                },
            });

            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const userIds = Array.from(
                new Set(
                    event.registrations
                        .map((registration) => registration.user_id)
                        .filter((userId): userId is bigint => userId !== null)
                )
            );

            const linkedUsers = userIds.length > 0
                ? await prisma.users.findMany({
                    where: { id: { in: userIds } },
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        role: true,
                        gender: true,
                        study_program: true,
                        phone_number: true,
                        term: true,
                        created_at: true,
                    },
                })
                : [];

            const linkedUserMap = new Map(linkedUsers.map((user) => [String(user.id), user]));

            res.json({
                ...fixDateTimeFormat(event),
                registration_count: event.registrations.length,
                registrations: event.registrations.map((registration) => ({
                    ...registration,
                    submitted_at: formatDateTime(registration.submitted_at),
                    updated_at: formatDateTime(registration.updated_at),
                    linked_user: registration.user_id ? linkedUserMap.get(String(registration.user_id)) ?? null : null,
                    profile: registration.profile,
                    answers: registration.answers.map((answer) => ({
                        ...answer,
                        created_at: formatDateTime(answer.created_at),
                    })),
                })),
            });

            console.log('GET: /admin/events/:id');
        } catch (error) {
            console.error('Get admin event detail error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/events/event-by-id
    app.get('/api/events/event-by-id', authenticateTokenOptional, async (req: AuthRequest, res) => {
        try {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'Event id required' });
            }
            const event = await prisma.events_info.findUnique({
                where: { id: Number(id) },
            });

            if (!event) {
                return res.status(400).json({ error: 'Event id does not exist in DB.' });
            }
            if (!req.user && event.invitation === 'members') {
                return res.status(403).json({ error: 'Access denied.' });
            }

            const includeFormFields = req.query.include_form_fields !== 'false';
            if (!includeFormFields) {
                let is_registered = false;
                if (req.user?.id) {
                    const existing = await prisma.event_registrations.findFirst({
                        where: {
                            event_id: event.id,
                            user_id: BigInt(req.user.id),
                            status: { not: 'cancelled' },
                        },
                        select: { id: true },
                    });
                    is_registered = Boolean(existing);
                }

                res.json({
                    ...fixDateTimeFormat(event),
                    is_registered,
                });
                console.log('GET: /events/event-by-id');
                return;
            }

            const form_fields = await getActiveEventFormFields(prisma, event.id);
            let is_registered = false;
            if (req.user?.id) {
                const existing = await prisma.event_registrations.findFirst({
                    where: {
                        event_id: event.id,
                        user_id: BigInt(req.user.id),
                        status: { not: 'cancelled' },
                    },
                    select: { id: true },
                });
                is_registered = Boolean(existing);
            }

            res.json({
                ...fixDateTimeFormat(event),
                form_fields,
                is_registered,
            });

            console.log("GET: /events/event-by-id");
        } catch (error) {
            console.error('Get event by id error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // POST /api/events/:id/register
    app.post('/api/events/:id/register', authenticateTokenOptional, async (req: AuthRequest, res) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: 'Invalid event id' });
            }

            const bodyProfile = (req.body?.profile ?? {}) as RegistrationProfilePayload;
            const bodyAnswers = Array.isArray(req.body?.answers) ? (req.body.answers as RegistrationAnswerPayload[]) : [];

            const event = await prisma.events_info.findUnique({ where: { id } });
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            if (event.deadline < new Date()) {
                return res.status(400).json({ error: 'Registration deadline has passed.' });
            }
            if (!req.user && event.invitation === EVENT_INVITATION_MEMBERS_ONLY) {
                return res.status(403).json({ error: 'This event is only available to members.' });
            }

            let userRecord: {
                id: bigint;
                first_name: string;
                last_name: string;
                email: string;
                phone_number: string;
                gender: $Enums.Gender;
                study_program: string;
            } | null = null;

            if (req.user?.id) {
                userRecord = await prisma.users.findUnique({
                    where: { id: BigInt(req.user.id) },
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                        gender: true,
                        study_program: true,
                    },
                });

                if (!userRecord) {
                    return res.status(401).json({ error: 'User no longer exists. Please sign in again.' });
                }
            }

            const first_name = userRecord ? userRecord.first_name : normalizeTrimmed(bodyProfile.first_name);
            const last_name = userRecord ? userRecord.last_name : normalizeTrimmed(bodyProfile.last_name);
            const email = userRecord ? userRecord.email : normalizeTrimmed(bodyProfile.email);
            const phone_number = userRecord ? userRecord.phone_number : normalizeTrimmed(bodyProfile.phone_number);
            const genderValue = userRecord ? userRecord.gender : normalizeTrimmed(bodyProfile.gender);
            let university_name = userRecord
                ? DEFAULT_UNIVERSITY_NAME
                : normalizeTrimmed(bodyProfile.university_name);
            let study_program = userRecord
                ? normalizeTrimmed(userRecord.study_program) || null
                : normalizeTrimmed(bodyProfile.study_program) || null;
            let is_student = userRecord ? true : boolOrDefault(bodyProfile.is_student, false);
            let is_alumnus = userRecord ? false : boolOrDefault(bodyProfile.is_alumnus, false);

            if (!first_name || !last_name || !email || !phone_number || !genderValue) {
                return res.status(400).json({ error: 'Missing essential fields in profile.' });
            }
            if (!NAME_REGEX.test(first_name) || !NAME_REGEX.test(last_name)) {
                return res.status(400).json({ error: 'Invalid first or last name format.' });
            }
            if (!EMAIL_REGEX.test(email)) {
                return res.status(400).json({ error: 'Invalid email format.' });
            }
            if (!PHONE_REGEX.test(phone_number)) {
                return res.status(400).json({ error: 'Invalid phone number format.' });
            }
            if (!isGender(genderValue)) {
                return res.status(400).json({ error: 'Invalid gender value.' });
            }

            // Signed-in users are always members; only dynamic fields are needed from UI.
            // We still persist a consistent snapshot for organizers.
            if (userRecord) {
                is_student = true;
                is_alumnus = false;
                university_name = DEFAULT_UNIVERSITY_NAME;
            } else {
                const invite = event.invitation;

                if (is_student && is_alumnus) {
                    return res.status(400).json({ error: 'Choose either student or alumnus status, not both.' });
                }

                if (invite === 'non_members') {
                    if (is_alumnus) {
                        return res.status(400).json({ error: 'Alumni are not allowed for this event.' });
                    }
                    if (!is_student) {
                        return res.status(400).json({ error: 'This event is only for students.' });
                    }
                    university_name = DEFAULT_UNIVERSITY_NAME;
                    if (!study_program) {
                        return res.status(400).json({ error: 'Study program is required for this event.' });
                    }
                    if (!SCHOOL_TEXT_REGEX.test(study_program)) {
                        return res.status(400).json({ error: 'Invalid study program format.' });
                    }
                }

                if (invite === 'alumni') {
                    if (!is_alumnus && !is_student) {
                        return res.status(400).json({ error: 'This event is for students or alumni.' });
                    }
                    university_name = DEFAULT_UNIVERSITY_NAME;
                    if (is_alumnus) {
                        study_program = null;
                    } else if (!study_program) {
                        return res.status(400).json({ error: 'Study program is required for students.' });
                    } else if (!SCHOOL_TEXT_REGEX.test(study_program)) {
                        return res.status(400).json({ error: 'Invalid study program format.' });
                    }
                }

                if (invite === 'all_students') {
                    if (!is_alumnus && !is_student) {
                        return res.status(400).json({ error: 'This event is for students or alumni.' });
                    }
                    if (is_alumnus) {
                        study_program = null;
                    } else {
                        if (!university_name) {
                            return res.status(400).json({ error: 'University name is required for students.' });
                        }
                        if (!SCHOOL_TEXT_REGEX.test(university_name)) {
                            return res.status(400).json({ error: 'Invalid university name format.' });
                        }
                        if (!study_program) {
                            return res.status(400).json({ error: 'Study program is required for students.' });
                        }
                        if (!SCHOOL_TEXT_REGEX.test(study_program)) {
                            return res.status(400).json({ error: 'Invalid study program format.' });
                        }
                    }
                }

                if (invite === 'non_students') {
                    if (is_student) {
                        if (!university_name) {
                            return res.status(400).json({ error: 'University name is required for students.' });
                        }
                        if (!SCHOOL_TEXT_REGEX.test(university_name)) {
                            return res.status(400).json({ error: 'Invalid university name format.' });
                        }
                        if (!study_program) {
                            return res.status(400).json({ error: 'Study program is required for students.' });
                        }
                        if (!SCHOOL_TEXT_REGEX.test(study_program)) {
                            return res.status(400).json({ error: 'Invalid study program format.' });
                        }
                    } else {
                        study_program = null;
                    }
                }

                if (!university_name) {
                    university_name = 'N/A';
                }
            }

            const formFields = await prisma.event_form_fields.findMany({
                where: { event_id: id, active: true },
                orderBy: { sort_order: 'asc' },
            });

            const fieldById = new Map(formFields.map((field) => [field.id, field]));
            const answersByFieldId = new Map(bodyAnswers.map((answer) => [answer.field_id, answer]));

            for (const field of formFields) {
                const answer = answersByFieldId.get(field.id);
                if (!answer) {
                    if (field.is_required) {
                        return res.status(400).json({ error: `Missing required answer for field: ${field.label}` });
                    }
                    continue;
                }

                if (field.field_type === 'short_text') {
                    const text = normalizeTrimmed(answer.short_text_value);
                    if (field.is_required && !text) {
                        return res.status(400).json({ error: `Field requires a text answer: ${field.label}` });
                    }
                }

                if (field.field_type === 'radio_single') {
                    const selected = normalizeTrimmed(answer.selected_option_value);
                    const validOptions = new Set(normalizeFieldOptions(field.options_json).map((option) => option.value));
                    if (!selected && field.is_required) {
                        return res.status(400).json({ error: `Field requires one selected option: ${field.label}` });
                    }
                    if (selected && !validOptions.has(selected)) {
                        return res.status(400).json({ error: `Invalid option selected for field: ${field.label}` });
                    }
                }

                if (field.field_type === 'checkbox_multi') {
                    const selectedOptions = Array.isArray(answer.selected_options_json)
                        ? answer.selected_options_json.map((item) => normalizeTrimmed(item)).filter(Boolean)
                        : [];
                    const validOptions = new Set(normalizeFieldOptions(field.options_json).map((option) => option.value));
                    if (selectedOptions.length === 0 && field.is_required) {
                        return res.status(400).json({ error: `Field requires at least one option: ${field.label}` });
                    }
                    const hasInvalidOption = selectedOptions.some((value) => !validOptions.has(value));
                    if (hasInvalidOption) {
                        return res.status(400).json({ error: `Invalid option selected for field: ${field.label}` });
                    }
                }
            }

            const quotedPrice = userRecord
                ? event.price_member
                : is_alumnus
                    ? event.price_alumnus
                    : event.price_nonmember;

            const result = await prisma.$transaction(async (tx) => {
                if (userRecord) {
                    const existingMemberRegistration = await tx.event_registrations.findFirst({
                        where: {
                            event_id: id,
                            user_id: userRecord.id,
                            status: { not: 'cancelled' },
                        },
                    });
                    if (existingMemberRegistration) {
                        throw new Error('You are already registered for this event.');
                    }
                } else {
                    const existingGuestRegistration = await tx.event_registrations.findFirst({
                        where: {
                            event_id: id,
                            status: { not: 'cancelled' },
                            profile: {
                                is: {
                                    email,
                                    phone_number,
                                },
                            },
                        },
                    });
                    if (existingGuestRegistration) {
                        throw new Error('A registration already exists for this email and phone number.');
                    }
                }

                const registration = await tx.event_registrations.create({
                    data: {
                        event_id: id,
                        user_id: userRecord?.id,
                        status: 'pending',
                        invitation_snapshot: event.invitation,
                        siblings_snapshot: event.siblings,
                        quoted_price: quotedPrice,
                        payment_required: false,
                    },
                });

                await tx.event_registration_profiles.create({
                    data: {
                        registration_id: registration.id,
                        first_name,
                        last_name,
                        email,
                        phone_number,
                        gender: genderValue,
                        is_student,
                        university_name,
                        study_program,
                        is_alumnus,
                    },
                });

                const answerRows: {
                    registration_id: string;
                    field_id: string;
                    short_text_value: string | null;
                    selected_option_value: string | null;
                    selected_options_json?: string[];
                    field_label_snapshot: string;
                }[] = [];

                for (const answer of bodyAnswers) {
                    const field = fieldById.get(answer.field_id);
                    if (!field) {
                        continue;
                    }

                    const trimmedText = normalizeTrimmed(answer.short_text_value) || null;
                    const radioValue = normalizeTrimmed(answer.selected_option_value) || null;
                    const checkboxValues = Array.isArray(answer.selected_options_json)
                        ? answer.selected_options_json.map((value) => normalizeTrimmed(value)).filter(Boolean)
                        : [];

                    const answerRow: {
                        registration_id: string;
                        field_id: string;
                        short_text_value: string | null;
                        selected_option_value: string | null;
                        field_label_snapshot: string;
                        selected_options_json?: string[];
                    } = {
                        registration_id: registration.id,
                        field_id: field.id,
                        short_text_value: field.field_type === 'short_text' ? trimmedText : null,
                        selected_option_value: field.field_type === 'radio_single' ? radioValue : null,
                        field_label_snapshot: field.label,
                    };

                    if (field.field_type === 'checkbox_multi') {
                        answerRow.selected_options_json = checkboxValues;
                    }

                    answerRows.push(answerRow);
                }

                if (answerRows.length > 0) {
                    await tx.event_registration_field_answers.createMany({
                        data: answerRows,
                    });
                }

                return registration;
            });

            res.status(201).json({
                message: 'Registration submitted successfully',
                registration_id: result.id,
                status: result.status,
            });

            console.log('POST: /events/:id/register');
        } catch (error) {
            console.error('Register event error:', error);
            const message = error instanceof Error ? error.message : 'Internal server error';
            if (message === 'You are already registered for this event.' || message === 'A registration already exists for this email and phone number.') {
                return res.status(409).json({ error: message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/events/:id/ics
    app.get('/api/events/:id/ics', authenticateTokenOptional, async (req: AuthRequest, res) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).send('Invalid event id');
            }

            const event = await prisma.events_info.findUnique({ where: { id: id } });
            if (!event) {
                return res.status(404).send('Event not found');
            }
            if (!req.user && event.invitation === 'members') {
                return res.status(403).send('Access denied');
            }

            const icsPayload = buildIcsPayload(event);
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Content-Disposition', `inline; filename="${event.title}.ics"`);
            res.send(icsPayload);

            console.log("GET: /events/:id/ics");
        } catch (error) {
            console.error('Get event ics error:', error);
            res.status(500).send('Internal server error');
        }
    });
}
