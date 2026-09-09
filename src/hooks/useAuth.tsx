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
  // Mutable mirror of the signed-in user. Event handlers are bound once and
  // their closures only ever see the first render's state, so a ref is needed
  // to compare what React believes against what session storage actually has
  // (e.g. after a tab was restored from the bfcache or re-focused).
  const userRef = useRef<AuthUser | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        // A definitive "no session" answer means logged out. Transient
        // failures (offline, throttled) must not sign an existing user out —
        // token auto-refresh retries in the background.
        if (/Auth session missing/i.test(error.message)) {
          setUser(null);
        } else {
          console.warn('[useAuth] Session check failed:', error.message);
        }
        setLoading(false);
        return;
      }
      if (data.user && !data.user.is_anonymous) {
        await fetchProfileAndSet(data.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    } catch (err) {
      console.warn('[useAuth] Session check threw:', err);
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

      // A genuine sign-in (email+password, OAuth, or a stored session that we
      // reconcile) supersedes any earlier recovery session — the recovery flag
      // must never poison a later login into a permanent "not logged in".
      // (Recovery redirects emit PASSWORD_RECOVERY, never SIGNED_IN, so this
      // can't turn an abandoned reset into a free login.)
      if (event === 'SIGNED_IN') {
        recoveryRef.current = false;
        setRecoveryMode(false);
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

    // Fast local restore: surface a stored session immediately with no network
    // round-trip, so anonymous visitors never wait on an auth request.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(null, session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) =>
      applySession(event, session),
    );

    // Tabs restored from the back-forward cache (or re-focused after auth
    // changed in another tab/webview) can keep a stale "logged out" React
    // state while a session already exists in storage. Re-read it locally and
    // fix the UI only when it disagrees with storage — recovery sessions are
    // left untouched so an abandoned reset can never become a free login.
    const reconcileFromStorage = () => {
      if (document.visibilityState !== 'visible') return;
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled || recoveryRef.current) return;
        const storedUserId = session?.user?.id ?? null;
        const currentUserId = userRef.current?.id ?? null;
        if (storedUserId && storedUserId !== currentUserId) {
          applySession('SIGNED_IN', session);
        } else if (!storedUserId && currentUserId) {
          // Signed out elsewhere while this tab was hidden.
          setUser(null);
          setLoading(false);
        }
      });
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reconcileFromStorage();
    };
    const onFocus = () => reconcileFromStorage();
    const onVisibilityChange = () => reconcileFromStorage();

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
