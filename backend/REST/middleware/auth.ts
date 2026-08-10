
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_please_change';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TEMP_TOKEN_EXPIRY = '5m'; // for password reset flow

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.', code: 'NO_TOKEN' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET) as any;
        req.user = verified;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token.', code: 'INVALID_TOKEN' });
    }
};

export const authenticateTokenOptional = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET) as any;
        req.user = verified;
        next();
    } catch (error) {
        // Token invalid/expired — proceed without user (optional auth)
        next();
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
};

/** Generate a short-lived access token (JWT). */
export const generateAccessToken = (user: { id: string; email: string; role: string }): string => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

/** Generate a temporary access token for password reset flow (5 min). */
export const generateTempAccessToken = (user: { id: string; email: string; role: string }): string => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: TEMP_TOKEN_EXPIRY }
    );
};

export { JWT_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY_MS, TEMP_TOKEN_EXPIRY };
