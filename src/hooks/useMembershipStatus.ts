import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export type MembershipPlanId = 'single_term' | 'two_term';

export type MembershipStatus = {
  loggedIn: boolean;
  term: string | null;
  membershipOpen: boolean;
  priceSingleTerm: number;
  priceTwoTerm: number;
  paid: boolean;
  paidPlan: MembershipPlanId | null;
  paidAmount: number | null;
  paidAt: string | null;
};

/**
 * Shared membership status for the membership page (hero badge + plan card).
 * Refetches when the signed-in user changes (e.g. after login/payment).
 * Falls back to defaults on failure so the page still renders.
 */
export const useMembershipStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiRequest('/membership/status', 'GET');
        if (!cancelled) setStatus(result);
      } catch {
        // Page keeps rendering with defaults when the status can't be loaded.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { status, loading };
};
