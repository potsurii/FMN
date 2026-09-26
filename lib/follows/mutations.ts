import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Follow another user. Rejects self-follow; duplicate is treated as success (idempotent).
 */
export async function followUser(
  supabase: SupabaseClient,
  options: { followerId: string; followingId: string },
): Promise<void> {
  if (options.followerId === options.followingId) {
    throw new Error("不能关注自己");
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: options.followerId,
    following_id: options.followingId,
  });

  if (error) {
    // Unique violation = already following
    if (error.code === "23505") {
      return;
    }
    if (error.code === "23514") {
      throw new Error("不能关注自己");
    }
    throw new Error(error.message || "关注失败");
  }
}

export async function unfollowUser(
  supabase: SupabaseClient,
  options: { followerId: string; followingId: string },
): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", options.followerId)
    .eq("following_id", options.followingId);

  if (error) {
    throw new Error(error.message || "取消关注失败");
  }
}
