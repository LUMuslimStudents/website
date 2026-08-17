import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { Navbar } from '@/components/Navbar';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }
    setSending(true);
    try {
      await apiRequest('/auth/forgot-password', 'POST', { email });
      setEmailSent(true);
      toast.success('If an account with that email exists, a reset link has been sent.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send reset link'));
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    try {
      await apiRequest('/auth/forgot-password', 'POST', { email });
      toast.success('A new reset link has been sent.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to resend reset link'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSendLink} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Enter your account email and we'll send you a link to reset your password.
                </p>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ab1234cd-s@student.lu.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? 'Sending link...' : 'Send reset link'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 w-16 h-16 mx-auto flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">We sent a password reset link to:</p>
                <p className="text-sm font-medium break-all">{email}</p>
                <p className="text-xs text-muted-foreground">
                  Check your inbox and follow the link to set a new password.
                  If you don't see it, check your spam folder.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {emailSent && (
              <Button variant="outline" className="w-full" onClick={handleResend} disabled={sending}>
                {sending ? 'Sending...' : 'Resend link'}
              </Button>
            )}
            <p className="text-sm text-muted-foreground text-center">
              <Link to="/login" className="text-primary hover:underline">Back to login</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;