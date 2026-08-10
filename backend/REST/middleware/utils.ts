import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn('Warning: EMAIL_USER or EMAIL_PASSWORD not set in environment variables');
}

export const transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});

// ── Token helpers (link-based) ───────────────────────────────────────────────

/** Generate a cryptographically random token for verification/reset links. */
export const generateToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/** SHA-256 hash a token for database storage. */
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/** Generate a 6-digit verification code (kept for backward compat if needed). */
export const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ── Email sending ────────────────────────────────────────────────────────────

/** Send a verification LINK email (Supabase-style). */
export const sendVerificationLink = async (email: string, token: string): Promise<boolean> => {
    const link = `${FRONTEND_URL}/api/auth/confirm-email?token=${encodeURIComponent(token)}`;
    try {
        await transporter.sendMail({
            from: EMAIL_USER,
            to: email,
            subject: 'Verify your email',
            html: `
                <h2>Verify Your Email</h2>
                <p>Click the link below to verify your email address:</p>
                <p><a href="${link}">${link}</a></p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            `,
        });
        return true;
    } catch (error) {
        console.error('Error sending verification link:', error);
        return false;
    }
};

/** Send a password reset LINK email. */
export const sendPasswordResetLink = async (email: string, token: string): Promise<boolean> => {
    const link = `${FRONTEND_URL}/reset-password?token_hash=${encodeURIComponent(token)}`;
    try {
        await transporter.sendMail({
            from: EMAIL_USER,
            to: email,
            subject: 'Reset your password',
            html: `
                <h2>Reset Your Password</h2>
                <p>Click the link below to reset your password:</p>
                <p><a href="${link}">${link}</a></p>
                <p>This link will expire in 10 minutes.</p>
                <p>If you didn't request this, you can ignore this email.</p>
            `,
        });
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};

// ── Legacy helpers (keep for potential backward compat) ──────────────────────

/** Send a 6-digit code verification email. @deprecated Use sendVerificationLink instead. */
export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
    try {
        await transporter.sendMail({
            from: EMAIL_USER,
            to: email,
            subject: 'Member Email Verification',
            html: `
                <h2>Verify Your Email</h2>
                <p>Your verification code is: <strong>${code}</strong></p>
                <p>This code will expire in 3 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
        });
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

/** Send a 6-digit password reset code. @deprecated Use sendPasswordResetLink instead. */
export const sendPasswordResetEmail = async (email: string, code: string): Promise<boolean> => {
    try {
        await transporter.sendMail({
            from: EMAIL_USER,
            to: email,
            subject: 'Password Reset Code',
            html: `
                <h2>Reset Your Password</h2>
                <p>Your password reset code is: <strong>${code}</strong></p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this, you can ignore this email.</p>
            `,
        });
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};
