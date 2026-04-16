import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';

const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const email = location.state?.email;

    // Redirect if no email provided
    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!code || code.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({ 
                email, 
                token: code,
                type: 'email'
            });
            if (error) throw error;
            toast.success('Email verified successfully! Please login.');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResending(true);
        try {
            const { error } = await supabase.auth.resend({ 
                type: 'signup',
                email
            });
            if (error) throw error;
            toast.success('New verification code sent to your email!');
            setCode(''); // Clear the input
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                We've sent a 6-digit verification code to:
                            </p>
                            <p className="text-sm font-medium text-center">{email}</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="code" className="block text-sm font-medium mb-2">
                                        Verification Code
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

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify Email'}
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button 
                            variant="outline"
                            className="w-full"
                            onClick={handleResendCode}
                            disabled={resending}
                        >
                            {resending ? 'Sending...' : 'Resend Code'}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            Want to start over?{' '}
                            <button
                                onClick={() => navigate('/signup')}
                                className="text-primary hover:underline"
                            >
                                Sign up again
                            </button>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default VerifyEmail;
