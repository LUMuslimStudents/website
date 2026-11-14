import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { SOCIALS } from '@/config/sponsors';
import type { SiteMetric } from ']/services/stats/stats';

export type SiteStats = {
  members: number;
  events: number;
  instagramFollowers: number;
  yearsActive: number;
};

/** Rendered until the view loads, and used if the request fails. */
const FALLBACKS: SiteStats = {
  members: 308,
  events: 50,
  instagramFollowers: SOCIALS.instagram.followers,
  yearsActive: 4,
};

const METRIC_TO_FIELD: Record<SiteMetric, keyof SiteStats> = {
  members_total: 'members',
  events_total: 'events',
  instagram_followers: 'instagramFollowers',
  years_active: 'yearsActive',
};

/**
 * Public organisation stats, computed server-side by the `site_stats` view
 * (members/events are lifetime counters preserved across GDPR purges).
 */
export const useSiteStats = (): SiteStats => {
  const [stats, setStats] = useState(FALLBACKS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result: Record<string, number> = await apiRequest('/stats/site', 'GET');
        if (cancelled || !result) return;

        setStats((prev) => {
          const next = { ...prev };
          for (const [metric, field] of Object.entries(METRIC_TO_FIELD)) {
            const value = Number(result[metric]);
            if (Number.isFinite(value) && value > 0) next[field] = value;
          }
          return next;
        });
      } catch {
        // Keep the fallbacks.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
};
