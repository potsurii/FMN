"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/foundation/Button";
import { createClient } from "@/lib/supabase/client";
import { followUser, unfollowUser } from "@/lib/follows/mutations";

type FollowButtonProps = {
  currentUserId: string;
  targetUserId: string;
  initiallyFollowing: boolean;
  className?: string;
};

export function FollowButton({
  currentUserId,
  targetUserId,
  initiallyFollowing,
  className = "",
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentUserId === targetUserId) {
    return null;
  }

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const previous = following;
    setFollowing(!previous);

    try {
      const supabase = createClient();
      if (previous) {
        await unfollowUser(supabase, {
          followerId: currentUserId,
          followingId: targetUserId,
        });
      } else {
        await followUser(supabase, {
          followerId: currentUserId,
          followingId: targetUserId,
        });
      }
      router.refresh();
    } catch (err) {
      setFollowing(previous);
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={following ? "ghost" : "primary"}
        disabled={busy}
        onClick={toggle}
        aria-pressed={following}
      >
        {busy ? "处理中…" : following ? "取消关注" : "关注"}
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-red-700/80" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
