import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from './auth';

export function setupUserRoutes(app: Express, prisma: PrismaClient) {
    // GET /api/admin/users - Admin only
    app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
        try {
            const users = await prisma.users.findMany();

            // Remove password from response
            const sanitizedUsers = users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

            res.json(sanitizedUsers);

            console.log("GET: /admin/users");
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
