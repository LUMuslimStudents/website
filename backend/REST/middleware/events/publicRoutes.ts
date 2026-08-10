import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateTokenOptional, AuthRequest } from '../auth';
import { buildIcsPayload, fixDateTimeFormat, getEventFormFields } from './shared';

export function setupEventPublicRoutes(app: Express, prisma: PrismaClient) {
    // GET /api/events/current-events
    app.get('/api/events/current-events', authenticateTokenOptional, async (req: AuthRequest, res) => {
        try {
            const isLoggedIn = Boolean(req.user);
            const events = await prisma.events_info.findMany({
                select: {
                    id: true,
                    title: true,
                    date: true,
                    start_time: true,
                    end_time: true,
                    deadline: true,
                    address: true,
                    invitation: true,
                    siblings: true,
                    price_member: true,
                    price_nonmember: true,
                    poster: true,
                },
                where: {
                    is_published: true,
                    date: { gte: new Date() },
                    ...(isLoggedIn ? {} : { invitation: { not: 'members' } })
                },
                orderBy: { date: 'desc' }
            });

            let registeredEventIds = new Set<number>();
            if (req.user?.id && events.length > 0) {
                const registrations = await prisma.event_registrations.findMany({
                    where: {
                        user_id: String(req.user.id),
                        status: { not: 'cancelled' },
                        event_id: { in: events.map((event) => event.id) },
                    },
                    select: { event_id: true },
                });
                registeredEventIds = new Set(registrations.map((registration) => registration.event_id));
            }

            res.json(events.map((event) => ({
                ...fixDateTimeFormat(event as never),
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
                select: {
                    id: true,
                    title: true,
                    date: true,
                    start_time: true,
                    end_time: true,
                    deadline: true,
                    address: true,
                    invitation: true,
                    siblings: true,
                    price_member: true,
                    price_nonmember: true,
                    poster: true,
                },
                where: {
                    is_published: true,
                    deadline: { lt: new Date() },
                    ...(isLoggedIn ? {} : { invitation: { not: 'members' } })
                },
                orderBy: { deadline: 'desc' }
            });

            let registeredEventIds = new Set<number>();
            if (req.user?.id && events.length > 0) {
                const registrations = await prisma.event_registrations.findMany({
                    where: {
                        user_id: String(req.user.id),
                        status: { not: 'cancelled' },
                        event_id: { in: events.map((event) => event.id) },
                    },
                    select: { event_id: true },
                });
                registeredEventIds = new Set(registrations.map((registration) => registration.event_id));
            }

            res.json(events.map((event) => ({
                ...fixDateTimeFormat(event as never),
                is_registered: registeredEventIds.has(event.id),
            })));
            // res.json(events);

            console.log("GET: /events/past-events");
        } catch (error) {
            console.error('Get current events error:', error);
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

            if (!event || (event as { is_published?: boolean }).is_published === false) {
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
                            user_id: String(req.user.id),
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

            const form_fields = await getEventFormFields(prisma, event.id);
            let is_registered = false;
            if (req.user?.id) {
                const existing = await prisma.event_registrations.findFirst({
                    where: {
                        event_id: event.id,
                        user_id: String(req.user.id),
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

    // GET /api/events/:id/ics
    app.get('/api/events/:id/ics', authenticateTokenOptional, async (req: AuthRequest, res) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).send('Invalid event id');
            }

            const event = await prisma.events_info.findUnique({ where: { id: id } });
            if (!event || (event as { is_published?: boolean }).is_published === false) {
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
