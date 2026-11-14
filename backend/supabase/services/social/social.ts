import { supabase } from ']/client';

export type SocialStat = {
  platform: string;
  follower_count: number;
  handle: string | null;
  synced_at: string;
};

// ── Platform-level stats ────────────────────────────────────────────────────
// Per-platform reads for future social integrations (Instagram posts, media,
// insights). The About/Collaborate tiles read the aggregate `site_stats` view
// instead, so this is currently unused by the pages.

export const getSocialStat = async (
  platform: string,
): Promise<SocialStat | null> => {
  const { data, error } = await supabase
    .from('social_stats')
    .select('platform, follower_count, handle, synced_at')
    .eq('platform', platform)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getSocialStats = async (): Promise<SocialStat[]> => {
  const { data, error } = await supabase
    .from('social_stats')
    .select('platform, follower_count, handle, synced_at')
    .order('platform', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};
