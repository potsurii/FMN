import { notFound } from "next/navigation";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { BackButton } from "@/components/navigation/BackButton";
import { Header } from "@/components/navigation/Header";
import { TripCard } from "@/components/travel/TripCard";
import { ProfileHeader } from "@/components/user/ProfileHeader";
import { requireUser } from "@/lib/auth/require-user";
import {
  fetchFollowCounts,
  fetchIsFollowing,
  fetchProfileById,
} from "@/lib/follows";
import { tripHref } from "@/lib/navigation/context";
import { listPublicTripsByUser } from "@/lib/search";
import type { TripWithStats } from "@/lib/trips/types";
import type { PublicTripSearchResult } from "@/lib/search/types";

export const dynamic = "force-dynamic";

type UserProfilePageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string }>;
};

function toTripCardModel(trip: PublicTripSearchResult): TripWithStats {
  return {
    id: trip.id,
    userId: trip.userId,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    mainImagePath: trip.mainImagePath,
    mainImageUrl: trip.mainImageUrl,
    destination: null,
    visibility: trip.visibility,
    travelStatus: trip.travelStatus,
    itemCount: 0,
    categoryCount: 0,
    spendByCurrency: [],
  };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: UserProfilePageProps) {
  const { userId } = await params;
  const { from } = await searchParams;
  const { supabase, user } = await requireUser();

  const profile = await fetchProfileById(supabase, userId);
  if (!profile) {
    notFound();
  }

  const [counts, isFollowing, publicTrips] = await Promise.all([
    fetchFollowCounts(supabase, userId),
    fetchIsFollowing(supabase, user.id, userId),
    listPublicTripsByUser(supabase, userId),
  ]);

  const back =
    from === "search"
      ? { href: "/search", label: "返回搜索页" }
      : { href: "/", label: "返回我的旅行" };

  const isSelf = user.id === userId;

  return (
    <div className="min-h-screen">
      <Header email={user.email} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-10">
        <BackButton href={back.href} label={back.label} />

        <ProfileHeader
          profile={profile}
          counts={counts}
          currentUserId={user.id}
          isFollowing={isFollowing}
          linkCounts={isSelf}
        />

        <section className="space-y-4">
          <div>
            <p className="mb-1 font-stamp text-[11px] tracking-[0.22em] text-[var(--color-stamp)] uppercase">
              Public Trips
            </p>
            <Heading level={2}>公开旅行</Heading>
            <Text className="mt-1 text-sm text-[var(--color-ink-muted)]">
              仅展示对方公开的旅行档案。
            </Text>
          </div>

          {publicTrips.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={toTripCardModel(trip)}
                  href={
                    isSelf
                      ? `/trips/${trip.id}`
                      : from === "search"
                        ? tripHref(trip.id, { from: "search" })
                        : `/trips/${trip.id}`
                  }
                  showVisibility={isSelf}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-paper)] border border-dashed border-[var(--color-line)] px-4 py-10 text-center">
              <Text className="text-sm text-[var(--color-ink-muted)]">
                暂无公开旅行。
              </Text>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
