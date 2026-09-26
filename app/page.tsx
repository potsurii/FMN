import Link from "next/link";
import { Button } from "@/components/foundation/Button";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { Header } from "@/components/navigation/Header";
import { TripArchive } from "@/components/travel/TripArchive";
import { requireUser } from "@/lib/auth/require-user";
import { fetchFollowCounts, fetchProfileById } from "@/lib/follows";
import { fetchTripsWithStats } from "@/lib/trips/queries";
import type { TripWithStats } from "@/lib/trips/types";

export const dynamic = "force-dynamic";

export default async function MyTripsPage() {
  const { supabase, user } = await requireUser();
  let trips: TripWithStats[] = [];
  let errorMessage: string | null = null;
  let followingCount = 0;
  let followersCount = 0;
  let displayName: string | null = null;

  try {
    const [tripList, counts, profile] = await Promise.all([
      fetchTripsWithStats(supabase, user.id),
      fetchFollowCounts(supabase, user.id),
      fetchProfileById(supabase, user.id),
    ]);
    trips = tripList;
    followingCount = counts.followingCount;
    followersCount = counts.followersCount;
    displayName = profile?.displayName ?? null;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "无法加载旅行数据";
  }

  const createAction = (
    <Link href="/trips/new">
      <Button>创建旅行</Button>
    </Link>
  );

  return (
    <div className="min-h-screen">
      <Header email={user.email} />

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <section className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 font-stamp text-[11px] tracking-[0.24em] text-[var(--color-stamp)] uppercase">
              My Trips
            </p>
            <Heading level={1} className="mb-3">
              我的旅行
            </Heading>
            <Text className="text-[var(--color-ink-muted)]">
              像翻阅旅行档案一样，查看每一次旅行的购物记录。
            </Text>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-ink-muted)]">
              <Link
                href={`/users/${user.id}`}
                className="transition-colors hover:text-[var(--color-ink)]"
              >
                {displayName?.trim() || "我的主页"}
              </Link>
              <Link
                href="/following"
                className="transition-colors hover:text-[var(--color-ink)]"
              >
                关注{" "}
                <span className="font-semibold text-[var(--color-ink)]">
                  {followingCount}
                </span>
              </Link>
              <Link
                href="/followers"
                className="transition-colors hover:text-[var(--color-ink)]"
              >
                粉丝{" "}
                <span className="font-semibold text-[var(--color-ink)]">
                  {followersCount}
                </span>
              </Link>
            </div>
          </div>
          {createAction}
        </section>

        {errorMessage ? (
          <div className="rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-6">
            <p className="font-semibold text-[var(--color-ink)]">加载失败</p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {errorMessage}
            </p>
            <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
              请确认本地 Supabase 正在运行（`npx supabase status`）。
            </p>
          </div>
        ) : (
          <TripArchive trips={trips} emptyAction={createAction} />
        )}
      </main>
    </div>
  );
}
