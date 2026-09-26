import Link from "next/link";
import { Text } from "@/components/foundation/Text";
import { FollowButton } from "@/components/user/FollowButton";
import type { ProfileSummary } from "@/lib/follows/types";

type UserListProps = {
  profiles: ProfileSummary[];
  currentUserId: string;
  /** Map of targetUserId → whether current user follows them */
  followingMap: Map<string, boolean>;
  emptyMessage: string;
  className?: string;
};

export function UserList({
  profiles,
  currentUserId,
  followingMap,
  emptyMessage,
  className = "",
}: UserListProps) {
  if (profiles.length === 0) {
    return (
      <div
        className={`rounded-[var(--radius-paper)] border border-dashed border-[var(--color-line)] px-4 py-10 text-center ${className}`}
      >
        <Text className="text-sm text-[var(--color-ink-muted)]">
          {emptyMessage}
        </Text>
      </div>
    );
  }

  return (
    <ul className={`space-y-3 ${className}`}>
      {profiles.map((profile) => {
        const name = profile.displayName?.trim() || "旅行者";
        const isSelf = profile.id === currentUserId;
        return (
          <li
            key={profile.id}
            className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3"
          >
            <Link
              href={`/users/${profile.id}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper-muted)] font-stamp text-xs tracking-wider text-[var(--color-stamp)] uppercase">
                {name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--color-ink)]">
                  {name}
                </p>
                {profile.bio ? (
                  <p className="truncate text-sm text-[var(--color-ink-muted)]">
                    {profile.bio}
                  </p>
                ) : null}
              </div>
            </Link>
            {!isSelf ? (
              <FollowButton
                currentUserId={currentUserId}
                targetUserId={profile.id}
                initiallyFollowing={followingMap.get(profile.id) ?? false}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
