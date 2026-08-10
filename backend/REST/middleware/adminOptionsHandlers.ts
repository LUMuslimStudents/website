import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from './auth';

export function setupAdminOptionsRoutes(app: Express, prisma: PrismaClient) {
    // GET /api/options/current — Public: get the current term's options
    app.get('/api/options/current', async (_req, res) => {
        try {
            const options = await prisma.admin_options.findFirst({
                where: { is_current: true },
            });

            if (!options) {
                return res.status(404).json({ error: 'No current term configured' });
            }

            res.json(options);
            console.log('GET /api/options/current');
        } catch (error) {
            console.error('Get current options error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/admin/options — Get all admin options (Admin only)
    app.get('/api/admin/options', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
        try {
            const options = await prisma.admin_options.findMany({
                orderBy: { term: 'asc' },
            });

            res.json(options);
            console.log('GET /api/admin/options');
        } catch (error) {
            console.error('Get admin options error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT /api/admin/options — Upsert admin options for a given term (Admin only)
    app.put('/api/admin/options', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
        try {
            const {
                term,
                price_single_term,
                price_discounted_two_term,
                membership_open,
                is_current,
            } = req.body;

            if (!term || typeof term !== 'string') {
                return res.status(400).json({ error: 'Missing required field: term' });
            }

            // If setting this term as current, unset all others first
            if (is_current === true) {
                await prisma.admin_options.updateMany({
                    where: { is_current: true },
                    data: { is_current: false },
                });
            }

            const options = await prisma.admin_options.upsert({
                where: { term },
                update: {
                    price_single_term: price_single_term !== undefined ? Number(price_single_term) : undefined,
                    price_discounted_two_term: price_discounted_two_term !== undefined ? Number(price_discounted_two_term) : undefined,
                    membership_open: membership_open !== undefined ? Boolean(membership_open) : undefined,
                    is_current: is_current !== undefined ? Boolean(is_current) : undefined,
                },
                create: {
                    term,
                    price_single_term: Number(price_single_term ?? 150),
                    price_discounted_two_term: Number(price_discounted_two_term ?? 300),
                    membership_open: membership_open !== undefined ? Boolean(membership_open) : true,
                    is_current: Boolean(is_current ?? false),
                },
            });

            res.json(options);
            console.log(`PUT /api/admin/options — term=${term}`);
        } catch (error) {
            console.error('Update admin options error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}

