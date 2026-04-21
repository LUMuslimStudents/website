import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { setupEventAdminRoutes } from './events/adminRoutes';
import { setupEventPublicRoutes } from './events/publicRoutes';
import { setupEventRegistrationRoutes } from './events/registrationRoutes';

export function setupEventRoutes(app: Express, prisma: PrismaClient) {
    setupEventAdminRoutes(app, prisma);
    setupEventPublicRoutes(app, prisma);
    setupEventRegistrationRoutes(app, prisma);
}
