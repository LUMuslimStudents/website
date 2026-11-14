import { adminClient, corsHeaders, jsonResponse } from '../_shared/db.ts';
import { GraphError, describeNode, graphGet, tokenFingerprint } from '../_shared/graph.ts';

/**
 * Daily public-stats sync.
 *
 * Each platform is one entry in SYNCERS: adding Facebook/Threads later means
 * adding an entry, not a new function or table. The endpoint is invoked by
 * pg_cron (see supabase/sql/sync_social_stats_cron.sql) and keeps JWT
 * verification on, so only callers holding a project key get through.
 */

type PlatformStat = {
  platform: string;
  follower_count: number;
  handle: string | null;
};

type Syncer = {
  platform: string;
  fetch: () => Promise<Omit<PlatformStat, 'platform'>>;
};

// A repeat trigger within this window is a no-op, never an API call.
const THROTTLE_MS = 90_000;

const instagram: Syncer = {
  platform: 'instagram',
  fetch: async () => {
    const igUserId = Deno.env.get('IG_USER_ID');
    if (!igUserId) throw new Error('IG_USER_ID is not configured');

    const user = await graphGet<{ followers_count: number; username?: string }>(igUserId, {
      fields: 'followers_count,username',
    });

    const followerCount = Number(user.followers_count);
    if (!Number.isFinite(followerCount)) {
      throw new Error('followers_count missing from Graph API response');
    }

    return {
      follower_count: followerCount,
      handle: user.username ? `@${user.username}` : null,
    };
  },
};

const SYNCERS: Syncer[] = [instagram];

type SyncError = {
  message: string;
  status?: number;
  code?: number;
  subcode?: number;
  fbtraceId?: string;
  path?: string;
  meta?: unknown;
  node?: unknown;
  token?: { length: number; sha256_8: string };
};

const lastSyncedAt = async (platform: string): Promise<number | null> => {
  const { data } = await adminClient
    .from('social_stats')
    .select('synced_at')
    .eq('platform', platform)
    .maybeSingle();

  return data?.synced_at ? Date.parse(data.synced_at) : null;
};

/** Fingerprint the token once, so failed calls prove which token is deployed. */
const makeFingerprinter = () => {
  let cached: SyncError['token'] | undefined;
  return async () => {
    if (!cached) {
      try {
        cached = await tokenFingerprint();
      } catch {
        // Token not configured; the error message already says so.
      }
    }
    return cached;
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const synced: PlatformStat[] = [];
  const skipped: string[] = [];
  const errors: Record<string, SyncError> = {};
  const fingerprint = makeFingerprinter();

  for (const syncer of SYNCERS) {
    const { platform } = syncer;

    try {
      const last = await lastSyncedAt(platform);
      if (last !== null && Date.now() - last < THROTTLE_MS) {
        skipped.push(platform);
        continue;
      }

      const stat = await syncer.fetch();

      // A failed fetch never reaches this point, so a bad token or Meta outage
      // leaves the previous (good) row untouched.
      const { error } = await adminClient.from('social_stats').upsert(
        { ...stat, platform, synced_at: new Date().toISOString() },
        { onConflict: 'platform' },
      );
      if (error) throw new Error(error.message);

      synced.push({ platform, ...stat });
    } catch (err) {
      const entry: SyncError = {
        message: err instanceof Error ? err.message : 'Unknown error',
        token: await fingerprint(),
      };

      if (err instanceof GraphError) {
        entry.status = err.status;
        entry.code = err.code;
        entry.subcode = err.subcode;
        entry.fbtraceId = err.fbtraceId;
        entry.path = err.path;
        entry.meta = err.details;
        // Field errors usually mean the configured id points at the wrong
        // object type — ask Meta what it actually is.
        if (err.code === 100) entry.node = await describeNode(err.path);
      }

      errors[platform] = entry;
      console.error(`[${platform}] sync failed: ${JSON.stringify(entry)}`);
    }
  }

  const attempted = SYNCERS.length - skipped.length;
  const ok = attempted === 0 || synced.length > 0;

  console.log(
    `sync-social-stats: synced=[${synced.map((s) => s.platform).join(',')}] ` +
      `skipped=[${skipped.join(',')}] errors=[${Object.keys(errors).join(',')}]`,
  );

  return jsonResponse({ ok, synced, skipped, errors }, ok ? 200 : 502);
});
