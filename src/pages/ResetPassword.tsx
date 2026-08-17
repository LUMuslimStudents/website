import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';

const passwordRegex = /^(?=.*[a-z])(?=.*\d).{6,}$/;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const { recoveryMode, loading: authLoading, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const completedRef = useRef(false);

  // The form is only valid inside an active recovery flow. A normal visitor or
  // an already-authenticated user (no valid reset link) must not be able to set
  // a password here.
  useEffect(() => {
    if (authLoading) return;
    if (!recoveryMode) {
      setTokenError(
        'This password reset link is invalid or has expired. Please request a new one.',
      );
    }
    // Strip any credential the reset redirect left in the URL.
    if (window.location.search || window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [recoveryMode, authLoading]);

  // If the user navigates away without completing the reset, tear down the
  // recovery session so the link can never double as a passwordless login.
  useEffect(() => {
    return () => {
      if (recoveryMode && !completedRef.current) {
        void signOut();
      }
    };
  }, [recoveryMode, signOut]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error('Both fields are required'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!passwordRegex.test(password)) { toast.error('Password must be at least 6 characters with lowercase and numbers'); return; }
    setUpdating(true);
    try {
      await apiRequest('/auth/update-password', 'POST', { password });
      completedRef.current = true;
      // End the recovery session so the user must re-authenticate with the new
      // password — the reset session itself never becomes a usable login.
      await signOut();
      toast.success('Password updated! You can now log in with your new password.');
      navigate('/login');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update password.'));
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) {
    return (<div className="min-h-dvh bg-background"><Navbar /><div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div></div>);
  }

  if (tokenError) {
    return (
      <div className="min-h-dvh bg-background"><Navbar />
        <div className="flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle className="text-2xl text-center">Reset link expired</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">{tokenError}</p>
              <Button asChild className="w-full"><Link to="/forgot-password">Request a new reset link</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background"><Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle className="text-2xl text-center">Set a new password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">Choose a new password for your account.</p>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">New password</label>
                <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirm new password</label>
                <Input id="confirmPassword" type="password" placeholder="******" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={updating}>{updating ? 'Updating password...' : 'Set new password'}</Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground"><Link to="/login" className="text-primary hover:underline">Back to login</Link></p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
