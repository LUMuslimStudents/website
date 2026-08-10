const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

/**
 * Normalize escaped markdown sequences in strings.
 */
const normalizeMarkdownEscapes = (text: string | null | undefined): string | null | undefined => {
    if (typeof text !== 'string') return text;
    return text
        .replace(/\\\\r\\\\n/g, '\n')
        .replace(/\\\\n/g, '\n')
        .replace(/\\\\t/g, '\t')
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
};

/**
 * Recursively normalize markdown fields in events and related objects.
 */
const normalizeEventData = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(normalizeEventData);
    if (typeof data === 'object') {
        const normalized: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === 'description' && typeof value === 'string') {
                normalized[key] = normalizeMarkdownEscapes(value);
            } else if (typeof value === 'object') {
                normalized[key] = normalizeEventData(value);
            } else {
                normalized[key] = value;
            }
        }
        return normalized;
    }
    return data;
};

// ── Token management ────────────────────────────────────────────────────────

const getAccessToken = (): string | null => localStorage.getItem('access_token');
const getRefreshToken = (): string | null => localStorage.getItem('refresh_token');

const setTokens = (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
    }
};

const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Also clear the old 'token' key for backward compat
    localStorage.removeItem('token');
};

// ── Refresh mutex (prevents concurrent refresh attempts) ────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const attemptTokenRefresh = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            clearTokens();
            window.dispatchEvent(new Event('auth-state-changed'));
            return false;
        }

        const data = await response.json();
        setTokens(data.access_token, data.refresh_token);
        window.dispatchEvent(new Event('auth-state-changed'));
        return true;
    } catch {
        clearTokens();
        window.dispatchEvent(new Event('auth-state-changed'));
        return false;
    }
};

const refreshTokensIfNeeded = async (): Promise<boolean> => {
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = attemptTokenRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
    });

    return refreshPromise;
};

// ── Main request function ───────────────────────────────────────────────────

export const RESTRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const isFormData = body instanceof FormData;
    const headers: HeadersInit = {};

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    // Attach access token if available
    const accessToken = getAccessToken();
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const makeRequest = () =>
        fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
        });

    let response = await makeRequest();

    // ── Handle 401 with auto-refresh ────────────────────────────────────────
    if (response.status === 401) {
        let errorData: any;
        try {
            errorData = await response.json();
        } catch {
            errorData = {};
        }

        // Only attempt refresh on TOKEN_EXPIRED (not on invalid/missing token)
        if (errorData.code === 'TOKEN_EXPIRED' || errorData.error?.includes('expired')) {
            const refreshed = await refreshTokensIfNeeded();

            if (refreshed) {
                // Update Authorization header with new token and retry
                const newAccessToken = getAccessToken();
                if (newAccessToken) {
                    headers['Authorization'] = `Bearer ${newAccessToken}`;
                }
                response = await makeRequest();
            } else {
                throw new Error(errorData.error || 'Session expired. Please log in again.');
            }
        } else {
            throw new Error(errorData.error || 'API request failed');
        }
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
    }

    // ── Capture tokens from auth responses ──────────────────────────────────
    const data = await response.json();

    // Store tokens from login / refresh / verify-reset responses
    if (data.access_token) {
        setTokens(data.access_token, data.refresh_token);
        // Dispatch auth state change so useAuth picks up the new session
        window.dispatchEvent(new Event('auth-state-changed'));
    }

    // If signout clears the session
    if (endpoint === '/auth/signout' && method === 'POST') {
        clearTokens();
        window.dispatchEvent(new Event('auth-state-changed'));
    }

    return normalizeEventData(data);
};
