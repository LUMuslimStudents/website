// Shared Graph API client.
//
// One place owns the API version, the access token and Meta's error shape, so
// each syncer only has to describe the endpoint it cares about.

const GRAPH_VERSION = 'v27.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

type MetaError = {
  message?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

export class GraphError extends Error {
  status: number;
  /** Graph path that was requested, e.g. `17841400000000000`. */
  path: string;
  code?: number;
  subcode?: number;
  fbtraceId?: string;
  /** Raw Meta error payload, kept for diagnostics. */
  details?: MetaError;

  constructor(message: string, status: number, path: string, error?: MetaError) {
    super(message);
    this.name = 'GraphError';
    this.status = status;
    this.path = path;
    this.code = error?.code;
    this.subcode = error?.error_subcode;
    this.fbtraceId = error?.fbtrace_id;
    this.details = error;
  }
}

const accessToken = () => {
  const token = Deno.env.get('IG_ACCESS_TOKEN');
  if (!token) throw new Error('IG_ACCESS_TOKEN is not configured');
  return token;
};

/**
 * GET a Graph API node/edge. Throws GraphError for both transport failures and
 * API-level errors, so callers never have to inspect the payload themselves.
 */
export const graphGet = async <T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> => {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('access_token', accessToken());

  const res = await fetch(url);
  const body = await res.json().catch(() => null);

  if (!res.ok || body?.error) {
    const detail: MetaError | undefined = body?.error;
    throw new GraphError(
      detail?.message ?? `Graph API request failed (HTTP ${res.status})`,
      res.status,
      path,
      detail,
    );
  }

  return body as T;
};

/**
 * Non-reversible fingerprint of the configured token. Dashboard secrets are
 * write-only, so this is the only way to confirm which token is deployed
 * (compare it against a hash of the token you tested with).
 */
export const tokenFingerprint = async () => {
  const token = accessToken();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return { length: token.length, sha256_8: hex.slice(0, 8) };
};

/**
 * Ask Meta what a node actually is (`metadata.type`). Used when a field error
 * suggests we are pointing at the wrong object — e.g. a Page instead of an
 * Instagram Business Account.
 */
export const describeNode = async (path: string) => {
  try {
    return await graphGet<{
      id?: string;
      name?: string;
      metadata?: { type?: string };
    }>(path, { fields: 'id,name', metadata: '1' });
  } catch {
    return null;
  }
};
