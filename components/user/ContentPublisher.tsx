import Link from "next/link";
import { Text } from "@/components/foundation/Text";

type ContentPublisherProps = {
  userId: string;
  displayName: string | null;
  className?: string;
};

/**
 * Publisher credit for public discovery views (P6 → P7 / P5).
 * Links to P8 public profile.
 */
export function ContentPublisher({
  userId,
  displayName,
  className = "",
}: ContentPublisherProps) {
  const name = displayName?.trim() || "旅行者";

  return (
    <div className={className}>
      <Text as="p" className="text-sm text-[var(--color-ink-muted)]">
        发布用户{" "}
        <Link
          href={`/users/${userId}?from=search`}
          className="font-medium text-[var(--color-ink)] underline-offset-2 transition-colors hover:text-[var(--color-stamp)] hover:underline"
        >
          {name}
        </Link>
      </Text>
    </div>
  );
}
