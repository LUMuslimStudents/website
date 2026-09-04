import { Express } from 'express';
import { $Enums, Prisma, PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../auth';
import {
    EVENT_REGISTRATION_STATUSES,
    RegistrationStatusUpdatePayload,
    fixDateTimeFormat,
    formatDateTime,
    getEventFormFields,
    normalizeCreateEventFormFields,
    parseDateOnly,
    parseTimeOnly,
    removeUploadedFiles,
    toEventSlug,
    upload,
} from './shared';

export function setupEventAdminRoutes(app: Express, prisma: PrismaClient) {
    // POST /api/admin/create-event - Create event with image upload (Admin only)
    app.post('/api/admin/create-event', authenticateToken, requireAdmin, upload.array('image', 10), async (req: AuthRequest, res) => {
        try {
            const { title, date, start_time, end_time, deadline, address, invitation, siblings, price_member, price_nonmember, price_alumnus, description, form_fields, publish_mode } = req.body;

            // Get the current term from admin options
            const currentOptions = await prisma.admin_options.findFirst({
                where: { is_current: true },
            });
            const term = currentOptions?.term || 'XXXX';
            const normalizedPublishMode = String(publish_mode || 'publish').toLowerCase();
            const isPublished = normalizedPublishMode !== 'draft';
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

            const normalizedFormFields = normalizeCreateEventFormFields(form_fields);
            if (normalizedFormFields.error) {
                removeUploadedFiles(files);
                return res.status(400).json({ error: normalizedFormFields.error });
            }

            try {
                const event = await prisma.$transaction(async (tx) => {
                    const createdEvent = await tx.events_info.create({
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
                            is_published: isPublished,
                        }
                    });

                    if (normalizedFormFields.fields.length > 0) {
                        await tx.event_form_fields.createMany({
                            data: normalizedFormFields.fields.map((field) => ({
                                event_id: createdEvent.id,
                                question: field.question,
                                help_text: field.help_text,
                                field_type: field.field_type,
                                is_required: field.is_required,
                                sort_order: field.sort_order,
                                options: field.options,
                            })),
                        });
                    }

                    return createdEvent;
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

    // PATCH /api/admin/events/:id - Update event details with optional image upload (Admin only)
    app.patch('/api/admin/events/:id', authenticateToken, requireAdmin, upload.array('image', 10), async (req: AuthRequest, res) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                removeUploadedFiles(Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : []);
                return res.status(400).json({ error: 'Invalid event id' });
            }

            const existingEvent = await prisma.events_info.findUnique({
                where: { id },
                select: {
                    id: true,
                    poster: true,
                },
            });

            if (!existingEvent) {
                removeUploadedFiles(Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : []);
                return res.status(404).json({ error: 'Event not found' });
            }

            const { title, date, start_time, end_time, deadline, address, invitation, siblings, price_member, price_nonmember, price_alumnus, description, form_fields, publish_mode } = req.body;
            const normalizedPublishMode = String(publish_mode || 'publish').toLowerCase();
            const isPublished = normalizedPublishMode !== 'draft';
            const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
            const eventSlug = (req as AuthRequest & { eventSlug?: string }).eventSlug || toEventSlug(String(title || 'event'));

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

            const hasFormFields = Object.prototype.hasOwnProperty.call(req.body, 'form_fields');
            const normalizedFormFields = hasFormFields ? normalizeCreateEventFormFields(form_fields) : { fields: [] };
            if (hasFormFields && normalizedFormFields.error) {
                removeUploadedFiles(files);
                return res.status(400).json({ error: normalizedFormFields.error });
            }

            const updatedEvent = await prisma.$transaction(async (tx) => {
                const posterPath = files.length > 0 ? `events/${eventSlug}` : existingEvent.poster;
                const existingFormFields = await tx.event_form_fields.findMany({
                    where: { event_id: id },
                    select: { id: true },
                });
                const existingFieldIdSet = new Set(existingFormFields.map((field) => field.id));
                const seenFieldIds = new Set<string>();

                const event = await tx.events_info.update({
                    where: { id },
                    data: {
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
                        poster: posterPath,
                        is_published: isPublished,
                    },
                });

                if (hasFormFields) {
                    for (const field of normalizedFormFields.fields) {
                        const hasExistingId = Boolean(field.id && existingFieldIdSet.has(field.id));
                        if (hasExistingId && field.id) {
                            seenFieldIds.add(field.id);
                            await tx.event_form_fields.update({
                                where: { id: field.id },
                                data: {
                                    question: field.question,
                                    help_text: field.help_text,
                                    field_type: field.field_type,
                                    is_required: field.is_required,
                                    sort_order: field.sort_order,
                                    options: field.options,
                                },
                            });
                        } else {
                            const createdField = await tx.event_form_fields.create({
                                data: {
                                    event_id: event.id,
                                    question: field.question,
                                    help_text: field.help_text,
                                    field_type: field.field_type,
                                    is_required: field.is_required,
                                    sort_order: field.sort_order,
                                    options: field.options,
                                },
                            });
                            seenFieldIds.add(createdField.id);
                        }
                    }

                    const removedFieldIds = existingFormFields
                        .map((field) => field.id)
                        .filter((fieldId) => !seenFieldIds.has(fieldId));

                    if (removedFieldIds.length > 0) {
                        await tx.event_form_fields.deleteMany({
                            where: { event_id: id, id: { in: removedFieldIds } },
                        });
                    }
                }

                return event;
            });

            res.status(200).json({
                message: 'Event updated successfully',
                event: {
                    ...updatedEvent,
                    date: updatedEvent.date.toISOString().split('T')[0],
                    start_time: updatedEvent.start_time.toISOString().split('T')[1].substring(0, 5),
                    end_time: updatedEvent.end_time.toISOString().split('T')[1].substring(0, 5),
                },
            });
        } catch (error) {
            console.error('Update event error:', error);
            removeUploadedFiles(Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : []);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PATCH /api/admin/events/:id/publish-state - Update publish status only (Admin only)
    app.patch('/api/admin/events/:id/publish-state', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: 'Invalid event id' });
            }

            const publishMode = String(req.body?.publish_mode ?? '').toLowerCase();
            const nextIsPublished = typeof req.body?.is_published === 'boolean'
                ? req.body.is_published
                : publishMode
                    ? publishMode !== 'draft'
                    : null;

            if (nextIsPublished === null) {
                return res.status(400).json({ error: 'Missing publish state' });
            }

            const updatedEvent = await prisma.events_info.update({
                where: { id },
                data: { is_published: nextIsPublished },
            });

            res.json({
                message: nextIsPublished ? 'Event published successfully' : 'Event unpublished successfully',
                event: {
                    ...updatedEvent,
                    date: updatedEvent.date.toISOString().split('T')[0],
                    start_time: updatedEvent.start_time.toISOString().split('T')[1].substring(0, 5),
                    end_time: updatedEvent.end_time.toISOString().split('T')[1].substring(0, 5),
                },
            });
        } catch (error) {
            console.error('Update event publish state error:', error);
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return res.status(404).json({ error: 'Event not found' });
            }
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
                        orderBy: { submitted_at: 'desc' },
                        include: {
                            profile: true,
                            answers: {
                                orderBy: { created_at: 'asc' },
                                include: {
                                    field: {
                                        select: {
                                            id: true,
                                            question: true,
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
                        .filter((userId): userId is string => userId !== null)
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
                        orderBy: { submitted_at: 'desc' },
                        include: {
                            profile: true,
                            answers: {
                                orderBy: { created_at: 'asc' },
                                include: {
                                    field: {
                                        select: {
                                            id: true,
                                            question: true,
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
                },
            });

            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const form_fields = await getEventFormFields(prisma, event.id);

            const userIds = Array.from(
                new Set(
                    event.registrations
                        .map((registration) => registration.user_id)
                        .filter((userId): userId is string => userId !== null)
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
                form_fields,
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

    // PATCH /api/admin/events/:id/registrations/status - Admin only
    app.patch('/api/admin/events/:id/registrations/status', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: 'Invalid event id' });
            }

            const updates = Array.isArray(req.body?.updates) ? (req.body.updates as RegistrationStatusUpdatePayload[]) : [];
            if (updates.length === 0) {
                return res.status(400).json({ error: 'No registration status updates provided' });
            }

            const normalizedUpdates = updates.map((update) => ({
                registration_id: typeof update?.registration_id === 'string' ? update.registration_id.trim() : '',
                status: typeof update?.status === 'string' ? update.status : '',
            }));

            if (normalizedUpdates.some((update) => !update.registration_id)) {
                return res.status(400).json({ error: 'Each update must include a registration_id' });
            }

            if (normalizedUpdates.some((update) => !EVENT_REGISTRATION_STATUSES.includes(update.status as $Enums.EventRegistrationStatus))) {
                return res.status(400).json({ error: 'Invalid registration status supplied' });
            }

            const registrationIds = normalizedUpdates.map((update) => update.registration_id);
            const uniqueRegistrationIds = new Set(registrationIds);
            if (uniqueRegistrationIds.size !== registrationIds.length) {
                return res.status(400).json({ error: 'Duplicate registration updates supplied' });
            }

            const updatedRegistrations = await prisma.$transaction(async (tx) => {
                const registrations = await tx.event_registrations.findMany({
                    where: {
                        event_id: id,
                        id: { in: registrationIds },
                    },
                    select: { id: true },
                });

                if (registrations.length !== registrationIds.length) {
                    throw new Error('One or more registrations were not found for this event.');
                }

                const updatesById = new Map(normalizedUpdates.map((update) => [update.registration_id, update.status as $Enums.EventRegistrationStatus]));

                for (const registration of registrations) {
                    const status = updatesById.get(registration.id);
                    if (!status) {
                        continue;
                    }

                    await tx.event_registrations.update({
                        where: { id: registration.id },
                        data: { status },
                    });
                }

                return tx.event_registrations.findMany({
                    where: {
                        event_id: id,
                        id: { in: registrationIds },
                    },
                    select: {
                        id: true,
                        status: true,
                        updated_at: true,
                    },
                });
            });

            res.json({
                message: 'Registration statuses updated successfully',
                registrations: updatedRegistrations.map((registration) => ({
                    ...registration,
                    updated_at: formatDateTime(registration.updated_at),
                })),
            });

            console.log('PATCH: /admin/events/:id/registrations/status');
        } catch (error) {
            console.error('Update registration statuses error:', error);
            const message = error instanceof Error ? error.message : 'Internal server error';
            if (message === 'One or more registrations were not found for this event.') {
                return res.status(404).json({ error: message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // DELETE /api/admin/events/:id/registrations/:registrationId - Admin only
    app.delete('/api/admin/events/:id/registrations/:registrationId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: 'Invalid event id' });
            }

            const registrationId = typeof req.params.registrationId === 'string' ? req.params.registrationId.trim() : '';
            if (!registrationId) {
                return res.status(400).json({ error: 'Invalid registration id' });
            }

            const registration = await prisma.event_registrations.findFirst({
                where: {
                    id: registrationId,
                    event_id: id,
                },
                select: {
                    id: true,
                    status: true,
                },
            });

            if (!registration) {
                return res.status(404).json({ error: 'Registration not found for this event.' });
            }

            await prisma.event_registrations.delete({
                where: { id: registration.id },
            });

            res.json({
                message: 'Registration deleted successfully',
                registration_id: registration.id,
                snapshot_preserved: false,
                cascaded_delete: {
                    profile: true,
                    answers: true,
                },
            });

            console.log('DELETE: /admin/events/:id/registrations/:registrationId');
        } catch (error) {
            console.error('Remove registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
