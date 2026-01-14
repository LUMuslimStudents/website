
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

app.use(cors());
app.use(express.json());

// Routes

// POST /api/auth/signup
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
            return res.status(400).json({ error: 'Password must be at least 6 characters with lowercase, and numbers' });
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

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        // If this is the FIRST user, maybe make them admin? Or just stick to default 'user'
        // User asked for specific admin credentials but didn't say to auto-create.
        // I will stick to default 'user'. User can manually update DB or I can provide a seed/script.
        // The user's request: "Admin Page: A protected route (only accessible to users with role='admin')"
        // "modified code to reflect these changes"

        // For now, default role is 'user'.

        const user = await prisma.users.create({
            data: {
                first_name,
                last_name,
                email,
                password: hashedPassword,
                study_program: study_program || '',
                phone_number: phone_number || '',
                role: 'user' // Explicitly set or default
            }
        });

        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
        console.error('Signup error:', error);
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
