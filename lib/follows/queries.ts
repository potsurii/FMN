import type { SupabaseClient } from "@supabase/supabase-js";
import type { FollowCounts, ProfileSummary } from "./types";

export async function fetchProfileById(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileSummary | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, bio, avatar_path")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id as string,
    displayName: (data.display_name as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
    avatarPath: (data.avatar_path as string | null) ?? null,
  };
}

export async function fetchFollowCounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<FollowCounts> {
  const [following, followers] = await Promise.all([
    supabase
      .from("follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", userId),
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", userId),
  ]);

  if (following.error) {
    throw new Error(`Failed to count following: ${following.error.message}`);
  }
  if (followers.error) {
    throw new Error(`Failed to count followers: ${followers.error.message}`);
  }

  return {
    followingCount: following.count ?? 0,
    followersCount: followers.count ?? 0,
  };
}

export async function fetchIsFollowing(
  supabase: SupabaseClient,
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (followerId === followingId) return false;

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check follow: ${error.message}`);
  }
  return Boolean(data);
}

export async function listFollowingProfiles(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileSummary[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id, created_at")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load following: ${error.message}`);
  }

  const ids = (data ?? []).map((row) => row.following_id as string);
  return fetchProfilesByIds(supabase, ids);
}

export async function listFollowerProfiles(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileSummary[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("following_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load followers: ${error.message}`);
  }

  const ids = (data ?? []).map((row) => row.follower_id as string);
  return fetchProfilesByIds(supabase, ids);
}

async function fetchProfilesByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<ProfileSummary[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, bio, avatar_path")
    .in("id", ids);

  if (error) {
    throw new Error(`Failed to load profiles: ${error.message}`);
  }

  const byId = new Map(
    (data ?? []).map((row) => [
      row.id as string,
      {
        id: row.id as string,
        displayName: (row.display_name as string | null) ?? null,
        bio: (row.bio as string | null) ?? null,
        avatarPath: (row.avatar_path as string | null) ?? null,
      } satisfies ProfileSummary,
    ]),
  );

  return ids
    .map((id) => byId.get(id))
    .filter((p): p is ProfileSummary => Boolean(p));
}

/** Batch display names for discovery cards (e.g. P6 recommended). */
export async function fetchDisplayNamesByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string | null>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const profiles = await fetchProfilesByIds(supabase, unique);
  const map = new Map<string, string | null>();
  for (const profile of profiles) {
    map.set(profile.id, profile.displayName);
  }
  return map;
}
