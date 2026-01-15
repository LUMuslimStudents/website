
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from './middleware/auth';

BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_please_change';

// Email configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn('Warning: EMAIL_USER or EMAIL_PASSWORD not set in environment variables');
}

const transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});

// Helper function to generate 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send verification email
const sendVerificationEmail = async (email: string, code: string) => {
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

app.use(cors());
app.use(express.json());

// Routes

// POST /api/auth/signup - Create unverified user and send verification code
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { first_name, last_name, email, password, study_program, phone_number } = req.body;

        if (!email || !password || !first_name || !last_name || !study_program || !phone_number) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Regex validation
        const nameRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s]+$/;
        const emailRegex = /^[a-zA-Z0-9.-]{5,}@student.lu.se$/;
        const phoneRegex = /^[\d\s+\-()]+$/;
        const programRegex = /^[a-zA-Z\s&()-]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*\d).{6,}$/;

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

        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters with lowercase and numbers' });
        }

        // Check if user exists
        const existingUser = await prisma.users.findFirst({
            where: { 
                OR: [
                    { email },
                    { phone_number }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            if (existingUser.phone_number === phone_number) {
                return res.status(400).json({ error: 'Phone number already exists' });
            }
        }

        // Check if pending signup exists
        const existingPending = await prisma.pending_signups.findFirst({
            where: { 
                OR: [
                    { email },
                    { phone_number }
                ]
            }
        });

        if (existingPending) {
            // Check if entire signup has expired
            const signupExpired = existingPending.expires_at < new Date();
            
            // Check if verification code has expired
            const codeExpired = !existingPending.email_verification_expires || 
                               existingPending.email_verification_expires < new Date();

            if (existingPending.email === email) {
                if (signupExpired) {
                    // Delete expired pending signup
                    await prisma.pending_signups.delete({ where: { id: existingPending.id } });
                    return res.status(400).json({ 
                        error: 'Previous signup expired. Please sign up again.'
                    });
                }

                // Code is still valid
                return res.status(400).json({ 
                    error: 'Email already has a pending signup',
                    message: 'You have an incomplete signup in progress. Please go to the verification page to complete it.',
                    pendingSignupId: existingPending.id,
                    email: existingPending.email,
                    codeExpired: false,
                    redirectTo: '/verify-email'
                });
            }
            if (existingPending.phone_number === phone_number) {
                return res.status(400).json({ 
                    error: 'Phone number already has a pending signup',
                    message: 'You have an incomplete signup in progress. Please go to the verification page to complete it.',
                    pendingSignupId: existingPending.id,
                    email: existingPending.email,
                    redirectTo: '/verify-email'
                });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate email verification code
        const emailVerificationCode = generateVerificationCode();
        const emailVerificationExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now
        const signupExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for entire signup

        // Create pending signup (NOT a real user account yet)
        const pendingSignup = await prisma.pending_signups.create({
            data: {
                first_name,
                last_name,
                email,
                phone_number,
                password: hashedPassword,
                study_program: study_program || '',
                email_verification_code: emailVerificationCode,
                email_verification_expires: emailVerificationExpires,
                verifications_completed: [], // Will track completed verifications
                expires_at: signupExpiresAt,
            }
        });

        // Send verification email
        const emailSent = await sendVerificationEmail(email, emailVerificationCode);
        
        if (!emailSent) {
            // Delete the pending signup if email fails to send
            await prisma.pending_signups.delete({ where: { id: pendingSignup.id } });
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        res.status(201).json({ 
            message: 'Verification code sent to email. Complete all verifications to create account.',
            email: email,
            pendingSignupId: pendingSignup.id 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/verify-email - Verify email and check if all verifications complete
app.post('/api/auth/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and verification code required' });
        }

        // Find pending signup
        const pendingSignup = await prisma.pending_signups.findUnique({ where: { email } });
        if (!pendingSignup) {
            return res.status(400).json({ error: 'No pending signup found' });
        }

        // Check if signup expired
        if (pendingSignup.expires_at < new Date()) {
            await prisma.pending_signups.delete({ where: { email } });
            return res.status(400).json({ error: 'Signup expired. Please sign up again.' });
        }

        // Check if email code matches
        if (pendingSignup.email_verification_code !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Check if code expired
        if (!pendingSignup.email_verification_expires || pendingSignup.email_verification_expires < new Date()) {
            return res.status(400).json({ error: 'Verification code expired' });
        }

        // Mark email as verified and update completions
        let completedVerifications = Array.isArray(pendingSignup.verifications_completed) 
            ? pendingSignup.verifications_completed 
            : [];
        
        if (!completedVerifications.includes('email')) {
            completedVerifications.push('email');
        }

        // Check if all required verifications are complete
        // For now, only email is required. Add 'payment' here in the future
        const requiredVerifications = ['email'];
        const allVerificationsComplete = requiredVerifications.every(v => completedVerifications.includes(v));

        if (allVerificationsComplete) {
            // Create actual user account
            const user = await prisma.users.create({
                data: {
                    first_name: pendingSignup.first_name,
                    last_name: pendingSignup.last_name,
                    email: pendingSignup.email,
                    password: pendingSignup.password,
                    phone_number: pendingSignup.phone_number,
                    study_program: pendingSignup.study_program,
                    role: 'user',
                }
            });

            // Delete pending signup
            await prisma.pending_signups.delete({ where: { email } });

            res.status(200).json({ 
                message: 'Email verified! Account created successfully.',
                userId: user.id 
            });
        } else {
            // Update pending signup with verified email
            await prisma.pending_signups.update({
                where: { email },
                data: {
                    email_verified_at: new Date(),
                    verifications_completed: completedVerifications,
                    email_verification_code: null,
                    email_verification_expires: null,
                }
            });

            res.status(200).json({ 
                message: 'Email verified. Complete remaining verifications to create account.',
                pendingVerifications: requiredVerifications.filter(v => !completedVerifications.includes(v))
            });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/resend-verification-code - Resend verification code
app.post('/api/auth/resend-verification-code', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find pending signup
        const pendingSignup = await prisma.pending_signups.findUnique({ where: { email } });
        if (!pendingSignup) {
            return res.status(400).json({ error: 'No pending signup found for this email' });
        }

        // Check if signup expired
        if (pendingSignup.expires_at < new Date()) {
            await prisma.pending_signups.delete({ where: { email } });
            return res.status(400).json({ error: 'Signup expired. Please sign up again.' });
        }

        // Generate new verification code
        const newVerificationCode = generateVerificationCode();
        const newVerificationExpires = new Date(Date.now() + 3 * 60 * 1000);

        // Update pending signup
        await prisma.pending_signups.update({
            where: { email },
            data: {
                email_verification_code: newVerificationCode,
                email_verification_expires: newVerificationExpires,
            }
        });

        // Send verification email
        const emailSent = await sendVerificationEmail(email, newVerificationCode);
        
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        res.status(200).json({ message: 'Verification code sent to your email' });
    } catch (error) {
        console.error('Resend error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/verification-time-remaining - Get remaining time for verification code
app.get('/api/auth/verification-time-remaining', async (req, res) => {
    try {
        const { email } = req.query;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find pending signup
        const pendingSignup = await prisma.pending_signups.findUnique({ where: { email } });
        if (!pendingSignup) {
            return res.status(400).json({ error: 'No pending signup found' });
        }

        // Check if signup expired
        if (pendingSignup.expires_at < new Date()) {
            await prisma.pending_signups.delete({ where: { email } });
            return res.status(400).json({ error: 'Signup expired. Please sign up again.' });
        }

        // Check if code expired
        if (!pendingSignup.email_verification_expires || pendingSignup.email_verification_expires < new Date()) {
            return res.status(400).json({ 
                error: 'Verification code expired',
                codeExpired: true,
                timeRemaining: 0
            });
        }

        // Calculate remaining time in seconds
        const now = new Date().getTime();
        const expireTime = pendingSignup.email_verification_expires.getTime();
        const timeRemaining = Math.ceil((expireTime - now) / 1000);

        res.status(200).json({ 
            timeRemaining: Math.max(0, timeRemaining),
            codeExpired: false
        });
    } catch (error) {
        console.error('Get time remaining error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/auth/pending-signup - Delete pending signup and start over
app.delete('/api/auth/pending-signup', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find and delete pending signup
        const pendingSignup = await prisma.pending_signups.findUnique({ where: { email } });
        if (!pendingSignup) {
            return res.status(400).json({ error: 'No pending signup found' });
        }

        await prisma.pending_signups.delete({ where: { email } });

        res.status(200).json({ message: 'Pending signup removed. You can sign up again.' });
    } catch (error) {
        console.error('Delete pending signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // User can only login if account was created (all verifications complete)
        // If user is in pending_signups, they haven't completed all verifications

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users - Admin only
app.get('/api/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const users = await prisma.users.findMany();

        // Remove password from response
        const sanitizedUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.json(sanitizedUsers);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
