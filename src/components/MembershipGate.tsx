// MembershipGate — app-wide guard: a signed-in user without a paid membership
// may only visit the membership checkout (plus auth + payment-success pages).
// UX only — server-side checks enforce the same rule on every API path.
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

const ALLOWED_PREFIXES = [
  '/membership/checkout',
  '/payment-success',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

export const MembershipGate = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [paid, setPaid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || user.role === 'admin') {
      setPaid(null);
      return;
    }
    let cancelled = false;
    apiRequest('/membership/status', 'GET')
      .then((status) => {
        if (!cancelled) setPaid(Boolean(status?.paid));
      })
      .catch(() => {
        if (!cancelled) setPaid(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const isAllowed = ALLOWED_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix),
  );
  const shouldRedirect = Boolean(
    user && user.role !== 'admin' && paid === false && !isAllowed,
  );

  useEffect(() => {
    if (shouldRedirect) {
      toast('You need to pay the membership fee to continue');
    }
  }, [shouldRedirect]);

  // Show a spinner while the auth session or payment status is resolving.
  // Admins bypass the payment check entirely (paid stays null for them).
  if (loading || (user && user.role !== 'admin' && paid === null)) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (shouldRedirect) {
    return <Navigate to="/membership/checkout" replace />;
  }

  return <>{children}</>;
};
