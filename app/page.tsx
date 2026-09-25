import Link from "next/link";
import { Button } from "@/components/foundation/Button";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { Header } from "@/components/navigation/Header";
import { TripArchive } from "@/components/travel/TripArchive";
import { requireUser } from "@/lib/auth/require-user";
import { fetchTripsWithStats } from "@/lib/trips/queries";
import type { TripWithStats } from "@/lib/trips/types";

export const dynamic = "force-dynamic";

export default async function MyTripsPage() {
  const { supabase, user } = await requireUser();
  let trips: TripWithStats[] = [];
  let errorMessage: string | null = null;

  try {
    trips = await fetchTripsWithStats(supabase, user.id);
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
