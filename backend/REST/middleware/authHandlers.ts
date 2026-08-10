import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
    generateToken,
    hashToken,
    sendVerificationLink,
    sendPasswordResetLink,
} from './utils';
import {
    AuthRequest,
    authenticateToken,
    generateAccessToken,
    generateTempAccessToken,
    REFRESH_TOKEN_EXPIRY_MS,
} from './auth';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*\d).{6,}$/;
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

export function setupAuthRoutes(app: Express, prisma: PrismaClient) {

    // ── POST /api/auth/signup ───────────────────────────────────────────────
    app.post('/api/auth/signup', async (req, res) => {
        try {
            console.log('POST: /auth/signup');
            const { first_name, last_name, email, password, gender, study_program, phone_number } = req.body;

            if (!email || !password || !first_name || !last_name || !gender || !study_program || !phone_number) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            if (gender !== 'male' && gender !== 'female') {
                return res.status(400).json({ error: 'Invalid gender value' });
            }

            const nameRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s]+$/;
            const emailRegex = /^[a-zA-Z0-9.-]{5,}@student.lu.se$/;
            const phoneRegex = /^[\d\s+\-()]+$/;
            const programRegex = /^[a-zA-Z\s&()-]+$/;

            if (!nameRegex.test(first_name)) {
                return res.status(400).json({ error: 'First name contains invalid characters' });
            }
            if (!nameRegex.test(last_name)) {
                return res.status(400).json({ error: 'Last name contains invalid characters' });
            }
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Not an LU student mail' });
            }
            if (!phoneRegex.test(phone_number)) {
                return res.status(400).json({ error: 'Phone number contains invalid characters' });
            }
            if (!programRegex.test(study_program)) {
                return res.status(400).json({ error: 'Study program contains invalid characters' });
            }
            if (!PASSWORD_REGEX.test(password)) {
                return res.status(400).json({ error: 'Password must be at least 6 characters with lowercase and numbers' });
            }

            const currentOptions = await prisma.admin_options.findFirst({
                where: { is_current: true },
            });
            if (!currentOptions) {
                return res.status(400).json({ error: 'No active term configured. Please contact an administrator.' });
            }
            if (!currentOptions.membership_open) {
                return res.status(400).json({ error: 'Membership registration is currently closed.' });
            }
            const currentTerm = currentOptions.term;

            const existingUser = await prisma.users.findFirst({
                where: { OR: [{ email }, { phone_number }] },
            });
            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(400).json({ error: 'A user with this email already exists.' });
                }
                if (existingUser.phone_number === phone_number) {
                    return res.status(400).json({ error: 'Phone number already in use.' });
                }
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const verificationToken = generateToken();
            const verificationTokenHash = hashToken(verificationToken);
            const verificationTokenExpires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

            const user = await prisma.users.create({
                data: {
                    first_name,
                    last_name,
                    email,
                    password: hashedPassword,
                    phone_number,
                    gender,
                    study_program: study_program || '',
                    role: 'user',
                    term: currentTerm,
                    email_verified: false,
                    verification_token: verificationTokenHash,
                    verification_token_expires: verificationTokenExpires,
                },
            });

            const emailSent = await sendVerificationLink(email, verificationToken);
            if (!emailSent) {
                console.warn('Failed to send verification link to:', email);
            }

            res.status(201).json({
                message: 'Account created! Please check your email and click the confirmation link to verify your account.',
                flow: 'link' as const,
                userId: user.id,
            });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ── GET /api/auth/confirm-email ─────────────────────────────────────────
    app.get('/api/auth/confirm-email', async (req, res) => {
        try {
            console.log('GET: /auth/confirm-email');
            const { token } = req.query;
            if (!token || typeof token !== 'string') {
                return res.status(400).json({ error: 'Missing or invalid verification token.' });
            }
            const tokenHash = hashToken(token);
            const user = await prisma.users.findFirst({
                where: { verification_token: tokenHash },
            });
            if (!user) {
                return res.status(400).json({ error: 'Invalid verification token.' });
            }
            if (!user.verification_token_expires || user.verification_token_expires < new Date()) {
                return res.status(400).json({ error: 'Verification token expired. Please sign up again.' });
            }

            await prisma.users.update({
                where: { id: user.id },
                data: {
                    email_verified: true,
                    email_confirmed_at: new Date(),
                    verification_token: null,
                    verification_token_expires: null,
                },
            });

            const wantsJson = req.headers.accept?.includes('application/json');
            if (wantsJson) {
                return res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/login?emailConfirmed=true`);
        } catch (error) {
            console.error('Confirm email error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ── POST /api/auth/login ────────────────────────────────────────────────
    app.post('/api/auth/login', async (req, res) => {
        try {
            console.log('POST: /auth/login');
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const user = await prisma.users.findUnique({ where: { email } });
            if (!user) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const accessToken = generateAccessToken({
                id: user.id, email: user.email, role: user.role,
            });
            const refreshToken = generateToken();
            const refreshTokenHash = hashToken(refreshToken);

            await prisma.refresh_tokens.deleteMany({ where: { user_id: user.id } });
            await prisma.refresh_tokens.create({
                data: {
                    user_id: user.id,
                    token_hash: refreshTokenHash,
                    expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
                },
            });

            res.json({
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: 900,
                user: {
                    id: user.id, email: user.email,
                    first_name: user.first_name, last_name: user.last_name,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ── POST /api/auth/refresh ──────────────────────────────────────────────
    app.post('/api/auth/refresh', async (req, res) => {
        try {
            console.log('POST: /auth/refresh');
            const { refresh_token } = req.body;
            if (!refresh_token || typeof refresh_token !== 'string') {
                return res.status(400).json({ error: 'Refresh token is required' });
            }
            const tokenHash = hashToken(refresh_token);
            const storedToken = await prisma.refresh_tokens.findUnique({
                where: { token_hash: tokenHash },
                include: { user: true },
            });
            if (!storedToken) {
                return res.status(401).json({ error: 'Invalid refresh token' });
            }
            if (storedToken.expires_at < new Date()) {
                await prisma.refresh_tokens.delete({ where: { id: storedToken.id } });
                return res.status(401).json({ error: 'Refresh token expired' });
            }

            const newRefreshToken = generateToken();
            const newRefreshTokenHash = hashToken(newRefreshToken);
            await prisma.$transaction([
                prisma.refresh_tokens.delete({ where: { id: storedToken.id } }),
                prisma.refresh_tokens.create({
                    data: {
                        user_id: storedToken.user_id,
                        token_hash: newRefreshTokenHash,
                        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
                    },
                }),
            ]);

            const accessToken = generateAccessToken({
                id: storedToken.user.id, email: storedToken.user.email, role: storedToken.user.role,
            });
            res.json({ access_token: accessToken, refresh_token: newRefreshToken, expires_in: 900 });
        } catch (error) {
            console.error('Refresh error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ── GET /api/auth/user ──────────────────────────────────────────────────
    app.get('/api/auth/user', authenticateToken, async (req: AuthRequest, res) => {
        try {
            console.log('GET: /auth/user');
            const user = await prisma.users.findUnique({ where: { id: req.user!.id } });
            if (!user) return res.status(404).json(null);
            res.json({
                id: user.id, email: user.email,
                first_name: user.first_name, last_name: user.last_name,
                phone_number: user.phone_number, gender: user.gender,
                study_program: user.study_program, role: user.role,
                term: user.term,
                created_at: user.created_at?.toISOString() ?? null,
            });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ── POST /api/auth/signout ──────────────────────────────────────────────
    app.post('/api/auth/signout', async (req, res) => {
        try {
            console.log('POST: /auth/signout');
            const { refresh_token } = req.body || {};
            if (refresh_token && typeof refresh_token === 'string') {
                const tokenHash = hashToken(refresh_token);
                await prisma.refresh_tokens.deleteMany({ where: { token_hash: tokenHash } });
            }
            res.json({ message: 'Signed out successfully' });
        } catch (error) {
            console.error('Signout error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ── POST /api/auth/forgot-password ──────────────────────────────────────
    app.post('/api/auth/forgot-password', async (req, res) => {
        try {
            console.log('POST: /auth/forgot-password');
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email is required' });

            const user = await prisma.users.findFirst({ where: { email } });
            if (!user) {
                return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
            }

            const resetToken = generateToken();
            const resetTokenHash = hashToken(resetToken);
            await prisma.password_reset_tokens.deleteMany({ where: { user_id: user.id } });
            await prisma.password_reset_tokens.create({
                data: {
                    user_id: user.id, email: user.email,
                    token_hash: resetTokenHash,
                    expires_at: new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS),
                },
            });

            const emailSent = await sendPasswordResetLink(email, resetToken);
            if (!emailSent) {
                await prisma.password_reset_tokens.deleteMany({ where: { user_id: user.id } });
                console.warn('Failed to send password reset link to:', email);
            }

            res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ── POST /api/auth/verify-reset ─────────────────────────────────────────
    app.post('/api/auth/verify-reset', async (req, res) => {
        try {
            console.log('POST: /auth/verify-reset');
            const { token_hash } = req.body;
            if (!token_hash || typeof token_hash !== 'string') {
                return res.status(400).json({ error: 'Missing reset token.' });
            }
            const tokenHash = hashToken(token_hash);
            const storedToken = await prisma.password_reset_tokens.findFirst({
                where: { token_hash: tokenHash },
            });
            if (!storedToken) {
                return res.status(400).json({ error: 'Invalid or expired reset token.' });
            }
            if (storedToken.expires_at < new Date()) {
                await prisma.password_reset_tokens.delete({ where: { id: storedToken.id } });
                return res.status(400).json({ error: 'Reset token expired. Please request a new one.' });
            }
            const user = await prisma.users.findUnique({ where: { id: storedToken.user_id } });
            if (!user) {
                await prisma.password_reset_tokens.delete({ where: { id: storedToken.id } });
                return res.status(404).json({ error: 'User not found.' });
            }

            const tempAccessToken = generateTempAccessToken({
                id: user.id, email: user.email, role: user.role,
            });
            res.json({
                message: 'Token verified. You can now set a new password.',
                access_token: tempAccessToken,
                expires_in: 300,
                user: { id: user.id, email: user.email },
            });
        } catch (error) {
            console.error('Verify reset error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ── POST /api/auth/update-password ──────────────────────────────────────
    app.post('/api/auth/update-password', authenticateToken, async (req: AuthRequest, res) => {
        try {
            console.log('POST: /auth/update-password');
            const { password } = req.body;
            if (!password || typeof password !== 'string') {
                return res.status(400).json({ error: 'Password is required' });
            }
            if (!PASSWORD_REGEX.test(password)) {
                return res.status(400).json({ error: 'Password must be at least 6 characters with lowercase and numbers' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await prisma.users.update({
                where: { id: req.user!.id },
                data: { password: hashedPassword },
            });
            await prisma.password_reset_tokens.deleteMany({ where: { user_id: req.user!.id } });

            res.json({ message: 'Password updated successfully! You can now log in with your new password.' });
        } catch (error) {
            console.error('Update password error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
