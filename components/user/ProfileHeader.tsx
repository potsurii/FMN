import Link from "next/link";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { FollowButton } from "@/components/user/FollowButton";
import type { FollowCounts, ProfileSummary } from "@/lib/follows/types";

type ProfileHeaderProps = {
  profile: ProfileSummary;
  counts: FollowCounts;
  currentUserId: string;
  isFollowing: boolean;
  /** When viewing own profile, counts link to P9/P10. */
  linkCounts?: boolean;
  className?: string;
};

export function ProfileHeader({
  profile,
  counts,
  currentUserId,
  isFollowing,
  linkCounts = false,
  className = "",
}: ProfileHeaderProps) {
  const isSelf = currentUserId === profile.id;
  const name = profile.displayName?.trim() || "旅行者";
  const initial = name.slice(0, 1);

  const followingLabel = (
    <span>
      关注{" "}
      <span className="font-semibold text-[var(--color-ink)]">
        {counts.followingCount}
      </span>
    </span>
  );
  const followersLabel = (
    <span>
      粉丝{" "}
      <span className="font-semibold text-[var(--color-ink)]">
        {counts.followersCount}
      </span>
    </span>
  );

  return (
    <section
      className={`rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-6 md:px-6 ${className}`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper-muted)] font-stamp text-lg tracking-wider text-[var(--color-stamp)] uppercase"
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0 space-y-2">
            <Heading level={1} className="text-2xl md:text-3xl">
              {name}
            </Heading>
            {profile.bio ? (
              <Text className="text-[var(--color-ink-muted)]">{profile.bio}</Text>
            ) : (
              <Text className="text-sm text-[var(--color-ink-muted)]">
                暂无简介
              </Text>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-ink-muted)]">
              {linkCounts && isSelf ? (
                <>
                  <Link
                    href="/following"
                    className="transition-colors hover:text-[var(--color-ink)]"
                  >
                    {followingLabel}
                  </Link>
                  <Link
                    href="/followers"
                    className="transition-colors hover:text-[var(--color-ink)]"
                  >
                    {followersLabel}
                  </Link>
                </>
              ) : (
                <>
                  {followingLabel}
                  {followersLabel}
                </>
              )}
            </div>
          </div>
        </div>

        {!isSelf ? (
          <FollowButton
            currentUserId={currentUserId}
            targetUserId={profile.id}
            initiallyFollowing={isFollowing}
            className="shrink-0"
          />
        ) : null}
      </div>
    </section>
  );
}
