import { supabase } from ']/client';

/** Metric names exposed by the public.site_stats view. */
export type SiteMetric =
  | 'members_total'
  | 'events_total'
  | 'instagram_followers'
  | 'years_active';

export type SiteStatsMap = Partial<Record<SiteMetric, number>>;

const METRICS: SiteMetric[] = [
  'members_total',
  'events_total',
  'instagram_followers',
  'years_active',
];

// ── Read the public stats view ──────────────────────────────────────────────
// Values are computed in SQL (supabase/sql/stat_totals.sql), so the site never
// derives them itself and never sees personal data.

export const getSiteStats = async (): Promise<SiteStatsMap> => {
  const { data, error } = await supabase
    .from('site_stats')
    .select('metric, value');

  if (error) {
    throw new Error(error.message);
  }

  const stats: SiteStatsMap = {};

  for (const row of data ?? []) {
    const metric = row.metric as SiteMetric | null;
    const value = Number(row.value);

    if (!metric || !METRICS.includes(metric)) continue;
    if (!Number.isFinite(value) || value <= 0) continue;

    stats[metric] = value;
  }

  return stats;
};
