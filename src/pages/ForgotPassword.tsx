import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { Navbar } from '@/components/Navbar';

const passwordRegex = /^(?=.*[a-z])(?=.*\d).{6,}$/;

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
};

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [requestingCode, setRequestingCode] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);
    const [codeSent, setCodeSent] = useState(false);

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('Email is required');
            return;
        }

        setRequestingCode(true);
        try {
            await apiRequest('/auth/forgot-password', 'POST', { email });
            setCodeSent(true);
            toast.success('A reset code has been sent to your email.');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to request password reset'));
        } finally {
            setRequestingCode(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !code || !password || !confirmPassword) {
            toast.error('All fields are required');
            return;
        }

        if (code.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!passwordRegex.test(password)) {
            toast.error('Password must be at least 6 characters with lowercase and numbers');
            return;
        }

        setResettingPassword(true);
        try {
            await apiRequest('/auth/reset-password', 'POST', { email, code, password });
            toast.success('Password reset successfully. Please log in with your new password.');
            navigate('/login', { state: { email } });
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to reset password'));
        } finally {
            setResettingPassword(false);
        }
    };

    const handleResendCode = async () => {
        setRequestingCode(true);
        try {
            await apiRequest('/auth/forgot-password', 'POST', { email });
            toast.success('A new reset code has been sent to your email.');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to resend reset code'));
        } finally {
            setRequestingCode(false);
        }
    };

    const resetEmailFlow = () => {
        setCodeSent(false);
        setCode('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!codeSent ? (
                            <form onSubmit={handleRequestCode} className="space-y-4">
                                <p className="text-sm text-muted-foreground text-center">
                                    Enter your account email and we’ll send a reset code.
                                </p>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ab1234cd-s@student.lu.se"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={requestingCode}>
                                    {requestingCode ? 'Sending code...' : 'Send reset code'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <p className="text-sm text-muted-foreground text-center">
                                    We sent a 6-digit reset code to:
                                </p>
                                <p className="text-sm font-medium text-center break-all">{email}</p>

                                <div className="space-y-2">
                                    <label htmlFor="code" className="block text-sm font-medium">
                                        Reset code
                                    </label>
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="000000"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        className="text-center text-2xl tracking-widest"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-medium">
                                        New password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="******"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium">
                                        Confirm new password
                                    </label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="******"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={resettingPassword}>
                                    {resettingPassword ? 'Resetting password...' : 'Reset password'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        {codeSent ? (
                            <Button variant="outline" className="w-full" onClick={handleResendCode} disabled={requestingCode}>
                                {requestingCode ? 'Sending...' : 'Resend code'}
                            </Button>
                        ) : null}
                        {codeSent ? (
                            <Button variant="ghost" className="w-full" onClick={resetEmailFlow}>
                                Use a different email
                            </Button>
                        ) : null}
                        <p className="text-sm text-muted-foreground text-center">
                            Remembered your password?{' '}
                            <Link to="/login" className="text-primary hover:underline">
                                Back to login
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;