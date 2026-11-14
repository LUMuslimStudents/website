import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

/**
 * Latest cached follower count for one platform, written daily by the
 * `sync-social-stats` edge function.
 *
 * Returns `fallback` until the value loads and keeps it if the request fails,
 * so the page never renders an empty stat. Platform-specific by design: the
 * pitch pages care about social reach, not org totals (that is `useSiteStats`).
 */
export const useSocialStat = (platform: string, fallback: number) => {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stat = await apiRequest(
          `/stats/social?platform=${encodeURIComponent(platform)}`,
          'GET',
        );
        const count = Number(stat?.follower_count);
        if (!cancelled && Number.isFinite(count) && count > 0) {
          setValue(count);
        }
      } catch {
        // Keep the fallback.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [platform, fallback]);

  return value;
};
