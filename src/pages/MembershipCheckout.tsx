// MembershipCheckout — the ONLY page an unpaid user can visit. Reached:
//  a) via the signup confirmation email link (?token_hash=...&type=signup)
//  b) via the membership gate after logging in unpaid
// Shows the plan chosen at signup and a "Continue to payment" button.
// Cancel deletes the account entirely.
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from ']/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CANCEL_CONFIRM_TEXT =
  'You must pay to be a member. If you cancel now, you need to restart the whole signup process again to become a member.';

const MembershipCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [plan, setPlan] = useState<'single_term' | 'two_term'>('single_term');
  const [status, setStatus] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // ── Verify the signup confirmation link (establishes the session) ────────
  useEffect(() => {
    const tokenHash = new URLSearchParams(location.search).get('token_hash');
    if (!tokenHash || user) return;

    let cancelled = false;
    (async () => {
      setVerifyingToken(true);
      try {
        await apiRequest('/auth/verify-signup', 'POST', { token_hash: tokenHash });
        // useAuth picks up the session via onAuthStateChange.
      } catch (error: any) {
        if (!cancelled) {
          setTokenError(error?.message || 'This confirmation link is invalid or expired.');
        }
      } finally {
        if (!cancelled) setVerifyingToken(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.search, user]);

  // ── Membership status + plan (from signup metadata, fallback single_term) ─
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const s = await apiRequest('/membership/status', 'GET');
        if (!cancelled) setStatus(s);
      } catch {
        // ignore — defaults below
      }
      try {
        const { data } = await supabase.auth.getUser();
        const metadataPlan = data.user?.user_metadata?.plan;
        if (!cancelled && (metadataPlan === 'single_term' || metadataPlan === 'two_term')) {
          setPlan(metadataPlan);
        }
      } catch {
        // keep default plan
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Already paid → done, go home.
  useEffect(() => {
    if (status?.paid) {
      toast.success('Your membership is active — welcome to LUMS!');
      navigate('/', { replace: true });
    }
  }, [status?.paid, navigate]);

  const handleContinue = async () => {
    setBusy(true);
    try {
      const { url } = await apiRequest('/membership/checkout', 'POST', { plan });
      window.location.assign(url);
    } catch (error: any) {
      toast.error(error?.message || 'Could not start the payment. Please try again.');
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setCancelling(true);
    (async () => {
      try {
        await apiRequest('/membership/cancel', 'POST');
        await supabase.auth.signOut();
        toast('Signup cancelled. You can create a new account anytime.');
        navigate('/signup', { replace: true });
      } catch (error: any) {
        setCancelling(false);
        setConfirmOpen(false);
        toast.error(error?.message || 'Could not cancel. Please try again.');
      }
    })();
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 container py-16 flex justify-center items-start">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Complete your membership
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {verifyingToken ? (
              <div className="flex flex-col items-center space-y-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Confirming your email…
                </p>
              </div>
            ) : tokenError ? (
              <div className="flex flex-col items-center space-y-4 py-4">
                <XCircle className="h-10 w-10 text-red-500" />
                <p className="text-center text-sm text-destructive">{tokenError}</p>
                <Button onClick={() => navigate('/login')}>Go to login</Button>
              </div>
            ) : !user && !authLoading ? (
              <div className="flex flex-col items-center space-y-4 py-4">
                <p className="text-center text-sm text-muted-foreground">
                  Sign up or log in to complete your membership payment.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    Log in
                  </Button>
                  <Button onClick={() => navigate('/signup')}>Sign up</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-full grid gap-3">
                  <button
                    type="button"
                    onClick={() => setPlan("single_term")}
                    className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                      plan === "single_term"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div>
                      <p className="font-medium">Single term</p>
                      <p className="text-sm text-muted-foreground">One semester</p>
                    </div>
                    <span className="text-lg font-bold">{status?.priceSingleTerm ?? 150} SEK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlan("two_term")}
                    className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                      plan === "two_term"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div>
                      <p className="font-medium">Two terms</p>
                      <p className="text-sm text-muted-foreground">
                        Both semesters — save{' '}
                        {Math.max(0, (status?.priceSingleTerm ?? 150) * 2 - (status?.priceTwoTerm ?? 300))} SEK
                      </p>
                    </div>
                    <span className="text-lg font-bold">{status?.priceTwoTerm ?? 300} SEK</span>
                  </button>
                </div>

                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Your payment unlocks member prices and members-only benifits.
                </p>
              </>
            )}
          </CardContent>
          {user && !tokenError && !verifyingToken && (
            <CardFooter className="flex flex-col gap-3">
              <Button
                className="w-full bg-[#004aac] hover:bg-[#004aac]/90 text-white"
                disabled={busy || cancelling || status?.paid}
                onClick={handleContinue}
              >
                {busy ? 'Opening payment page…' : 'Continue to payment'}
              </Button>
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                    disabled={busy || cancelling}
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel signup'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel signup?</AlertDialogTitle>
                    <AlertDialogDescription>{CANCEL_CONFIRM_TEXT}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={cancelling}>Keep going</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 text-white hover:bg-red-700"
                      disabled={cancelling}
                      onClick={(event) => {
                        event.preventDefault();
                        handleCancel();
                      }}
                    >
                      {cancelling ? 'Cancelling…' : 'Yes, cancel my signup'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default MembershipCheckout;
