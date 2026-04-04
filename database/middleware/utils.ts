import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

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

// Helper function to generate 6-digit verification code
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send verification email
export const sendVerificationEmail = async (email: string, code: string) => {
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
