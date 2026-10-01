import type { ReactNode } from "react";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { ItemCard } from "@/components/item/ItemCard";
import { Header } from "@/components/navigation/Header";
import { ItemSearchSortSelect } from "@/components/search/ItemSearchSortSelect";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SearchResultGroup } from "@/components/search/SearchResultGroup";
import { TripCard } from "@/components/travel/TripCard";
import { ContentPublisher } from "@/components/user/ContentPublisher";
import { requireUser } from "@/lib/auth/require-user";
import { fetchDisplayNamesByIds } from "@/lib/follows";
import type { ItemWithDisplay } from "@/lib/items/types";
import { tripHref } from "@/lib/navigation/context";
import {
  listRecommendedPublicItems,
  listRecommendedPublicTrips,
  searchProfiles,
  searchPublicItems,
  searchPublicTrips,
  type ItemSearchSort,
} from "@/lib/search";
import type {
  PublicItemSearchResult,
  PublicTripSearchResult,
} from "@/lib/search/types";
import type { TripWithStats } from "@/lib/trips/types";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; sort?: string }>;
};

function parseSort(raw: string | undefined): ItemSearchSort {
  if (raw === "recommend" || raw === "price" || raw === "latest") return raw;
  return "latest";
}

function toTripCardModel(trip: PublicTripSearchResult): TripWithStats {
  return {
    id: trip.id,
    userId: trip.userId,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    mainImagePath: trip.mainImagePath,
    mainImageUrl: trip.mainImageUrl,
    visibility: trip.visibility,
    travelStatus: trip.travelStatus,
    itemCount: 0,
    categoryCount: 0,
    spendByCurrency: [],
  };
}

function toItemCardModel(item: PublicItemSearchResult): ItemWithDisplay {
  return {
    id: item.id,
    tripId: item.tripId,
    name: item.name,
    price: item.price,
    currency: item.currency,
    location: item.location,
    purchaseDate: item.purchaseDate,
    category: item.category,
    imagePath: item.imagePath,
    imageUrl: item.imageUrl,
    note: null,
    visibility: item.visibility,
    quantity: 1,
  };
}

/** Card + publisher link as siblings (no nested anchors). */
function withPublisher(
  userId: string,
  displayNames: Map<string, string | null>,
  card: ReactNode,
) {
  return (
    <div className="flex flex-col gap-2">
      {card}
      <ContentPublisher
        userId={userId}
        displayName={displayNames.get(userId) ?? null}
        className="px-0.5"
      />
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const sort = parseSort(params.sort);
  const { supabase, user } = await requireUser();

  let errorMessage: string | null = null;

  let recommendedTrips: PublicTripSearchResult[] = [];
  let recommendedItems: PublicItemSearchResult[] = [];
  let itemResults: PublicItemSearchResult[] = [];
  let tripResults: PublicTripSearchResult[] = [];
  let profileResults: Awaited<ReturnType<typeof searchProfiles>> = [];
  let publisherNames = new Map<string, string | null>();

  try {
    if (!query) {
      [recommendedTrips, recommendedItems] = await Promise.all([
        listRecommendedPublicTrips(supabase),
        listRecommendedPublicItems(supabase),
      ]);
      publisherNames = await fetchDisplayNamesByIds(supabase, [
        ...recommendedTrips.map((trip) => trip.userId),
        ...recommendedItems.map((item) => item.userId),
      ]);
    } else {
      [itemResults, tripResults, profileResults] = await Promise.all([
        searchPublicItems(supabase, query, sort),
        searchPublicTrips(supabase, query),
        searchProfiles(supabase, query),
      ]);
    }
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "无法加载搜索数据";
  }

  return (
    <div className="min-h-screen">
      <Header email={user.email} />

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6 md:py-10">
        <section className="max-w-2xl space-y-4">
          <div>
            <p className="mb-2 font-stamp text-[11px] tracking-[0.24em] text-[var(--color-stamp)] uppercase">
              Search
            </p>
            <Heading level={1} className="mb-3">
              搜索
            </Heading>
            <Text className="text-[var(--color-ink-muted)]">
              发现其他旅行者公开的旅行与购物记录。
            </Text>
          </div>
          <SearchInput initialQuery={query} />
        </section>

        {errorMessage ? (
          <div className="rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-6">
            <p className="font-semibold text-[var(--color-ink)]">加载失败</p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {errorMessage}
            </p>
          </div>
        ) : null}

        {!errorMessage && !query ? (
          <>
            <SearchResultGroup
              stamp="Recommended Trips"
              title="推荐公开旅行"
              emptyMessage="暂时没有公开旅行。"
            >
              {recommendedTrips.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendedTrips.map((trip) => (
                    <div key={trip.id}>
                      {withPublisher(
                        trip.userId,
                        publisherNames,
                        <TripCard
                          trip={toTripCardModel(trip)}
                          href={tripHref(trip.id, { from: "search" })}
                          showVisibility={false}
                        />,
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </SearchResultGroup>

            <SearchResultGroup
              stamp="Recommended Items"
              title="推荐公开购物记录"
              emptyMessage="暂时没有公开购物记录。"
            >
              {recommendedItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recommendedItems.map((item) => (
                    <div key={item.id}>
                      {withPublisher(
                        item.userId,
                        publisherNames,
                        <ItemCard
                          item={toItemCardModel(item)}
                          navFrom="search"
                          recommendationCounts={item.recommendationCounts}
                        />,
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </SearchResultGroup>
          </>
        ) : null}

        {!errorMessage && query ? (
          <div className="space-y-10">
            <div>
              <p className="mb-1 font-stamp text-[11px] tracking-[0.22em] text-[var(--color-stamp)] uppercase">
                Results
              </p>
              <Heading level={2}>搜索结果</Heading>
              <Text className="mt-1 text-sm text-[var(--color-ink-muted)]">
                「{query}」
              </Text>
            </div>

            <SearchResultGroup
              stamp="Products"
              title="商品"
              emptyMessage="没有找到相关商品。"
              action={<ItemSearchSortSelect query={query} sort={sort} />}
            >
              {itemResults.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {itemResults.map((item) => (
                    <SearchResultCard
                      key={item.id}
                      variant="product"
                      item={item}
                      recommendationCounts={item.recommendationCounts}
                    />
                  ))}
                </div>
              ) : null}
            </SearchResultGroup>

            <SearchResultGroup
              stamp="Trips"
              title="旅行"
              emptyMessage="没有找到相关旅行。"
            >
              {tripResults.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tripResults.map((trip) => (
                    <SearchResultCard
                      key={trip.id}
                      variant="travel"
                      trip={trip}
                    />
                  ))}
                </div>
              ) : null}
            </SearchResultGroup>

            <SearchResultGroup
              stamp="Travelers"
              title="用户"
              emptyMessage="没有找到相关用户。"
            >
              {profileResults.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {profileResults.map((profile) => (
                    <SearchResultCard
                      key={profile.id}
                      variant="user"
                      profile={profile}
                    />
                  ))}
                </div>
              ) : null}
            </SearchResultGroup>
          </div>
        ) : null}
      </main>
    </div>
  );
}
