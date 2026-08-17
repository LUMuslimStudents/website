import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from ']/client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { apiRequest } from '@/lib/api';

const BACKEND = import.meta.env.VITE_BACKEND;

// A password-recovery redirect carries a short-lived credential in the URL.
// The auth backend consumes and strips it during its async initialization, so
// we capture the "this is a recovery flow" signal synchronously at module load
// — before that stripping can happen — and reconcile it with backend auth
// events below. Kept here (not in a page) so pages stay backend-agnostic.
const initialRecoveryFromUrl =
  typeof window !== 'undefined' &&
  /(?:^|[#&?])type=recovery(?:&|$)/.test(
    `${window.location.hash}${window.location.search}`,
  );

// ── Public interface (backend-agnostic) ──────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string | undefined;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  gender: string;
  study_program: string;
  role: string;
  term: string | null;
  created_at: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /**
   * True when the visitor arrived via a password-recovery link. In this state
   * `user` is intentionally null — a recovery session may ONLY be used to set a
   * new password, never to browse the app as an authenticated user. Backend-
   * agnostic: each backend implementation is responsible for setting this.
   */
  recoveryMode: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  recoveryMode: false,
  signOut: async () => {},
  refresh: async () => {},
});

// ── Supabase helpers ─────────────────────────────────────────────────────────

const buildAuthUser = (
  authUser: SupabaseUser,
  profile: Record<string, unknown> | null,
): AuthUser => {
  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;

  return {
    id: authUser.id,
    email: authUser.email,
    first_name:
      (profile?.first_name as string) ||
      (meta.first_name as string) ||
      '',
    last_name:
      (profile?.last_name as string) ||
      (meta.last_name as string) ||
      '',
    phone_number:
      (profile?.phone_number as string) ||
      (meta.phone_number as string) ||
      null,
    gender:
      (profile?.gender as string) ||
      (meta.gender as string) ||
      'male',
    study_program:
      (profile?.study_program as string) ||
      (meta.study_program as string) ||
      '',
    role: (profile?.role as string) || 'user',
    term:
      (profile?.term as string) ||
      (meta.term as string) ||
      null,
    created_at:
      (profile?.created_at as string) ||
      authUser.created_at ||
      null,
  };
};

// ── REST helpers ─────────────────────────────────────────────────────────────

const getAccessToken = (): string | null =>
  localStorage.getItem('access_token');

/** Fetch the current user from REST API. Returns null if not authenticated. */
const fetchRestUser = async (): Promise<AuthUser | null> => {
  try {
    const data = await apiRequest('/auth/user', 'GET');
    if (!data) return null;
    return {
      id: data.id,
      email: data.email,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      phone_number: data.phone_number || null,
      gender: data.gender || 'male',
      study_program: data.study_program || '',
      role: data.role || 'user',
      term: data.term || null,
      created_at: data.created_at || null,
    } as AuthUser;
  } catch {
    return null;
  }
};

// ── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  // Mutable mirror of recovery state so async auth callbacks always read the
  // latest value without being re-created.
  const recoveryRef = useRef(initialRecoveryFromUrl);

  // ── Supabase path ─────────────────────────────────────────────────────────

  const fetchProfileAndSet = useCallback(async (authUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('[useAuth] Profile fetch error:', error.message, error);
      }

      setUser(buildAuthUser(authUser, profile));
    } catch (err) {
      console.error('[useAuth] Profile fetch threw:', err);
      setUser(buildAuthUser(authUser, null));
    } finally {
      setLoading(false);
    }
  }, []);

  const supabaseRefresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user && !data.user.is_anonymous) {
      await fetchProfileAndSet(data.user);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [fetchProfileAndSet]);

  // Supabase: Initial load + session listener
  useEffect(() => {
    if (BACKEND !== 'supabase') return;

    let cancelled = false;

    // Reconcile every session read/event through one place so a recovery
    // session is never surfaced as a logged-in user.
    const applySession = (event: string | null, session: Session | null) => {
      if (cancelled) return;

      // A recovery link establishes a real session. Flag it so it can't be
      // used as a normal login (otherwise abandoning the reset = a free login).
      if (event === 'PASSWORD_RECOVERY') {
        recoveryRef.current = true;
      }

      // Signing out ends any recovery session and clears the flag.
      if (event === 'SIGNED_OUT') {
        recoveryRef.current = false;
        setRecoveryMode(false);
        setUser(null);
        setLoading(false);
        return;
      }

      if (recoveryRef.current) {
        setRecoveryMode(true);
        setUser(null); // recovery session is NOT an authenticated user
        setLoading(false);
        return;
      }

      if (session?.user && !session.user.is_anonymous) {
        fetchProfileAndSet(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(null, session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) =>
      applySession(event, session),
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndSet]);

  const supabaseSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    recoveryRef.current = false;
    setRecoveryMode(false);
    setUser(null);
  }, []);

  // ── REST path ─────────────────────────────────────────────────────────────

  /** Refresh user from REST API. */
  const restRefresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const userData = await fetchRestUser();
    setUser(userData);
    setLoading(false);
  }, []);

  // REST: Initial load + auth-state-changed listener
  useEffect(() => {
    if (BACKEND !== 'REST') return;

    // Check for existing token on mount
    restRefresh();

    // Listen for auth state changes (dispatched by REST.api.ts)
    const handleAuthChange = () => {
      restRefresh();
    };
    window.addEventListener('auth-state-changed', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, [restRefresh]);

  const restSignOut = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await apiRequest('/auth/signout', 'POST', { refresh_token: refreshToken });
    } catch {
      // Ignore errors — we're signing out regardless
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    window.dispatchEvent(new Event('auth-state-changed'));
  }, []);

  // ── Choose implementation ─────────────────────────────────────────────────

  const signOut = BACKEND === 'supabase' ? supabaseSignOut : restSignOut;
  const refresh = BACKEND === 'supabase' ? supabaseRefresh : restRefresh;

  return (
    <AuthContext.Provider value={{ user, loading, recoveryMode, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ────────────────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext);
