import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/foundation/Button";
import { Heading } from "@/components/foundation/Heading";
import { ShareButton } from "@/components/foundation/ShareButton";
import { ItemGrid } from "@/components/item/ItemGrid";
import { BackButton } from "@/components/navigation/BackButton";
import { Header } from "@/components/navigation/Header";
import { ShoppingTodoList } from "@/components/todo/ShoppingTodoList";
import { TripCover } from "@/components/travel/TripCover";
import { TripDetailActions } from "@/components/travel/TripDetailActions";
import { ContentPublisher } from "@/components/user/ContentPublisher";
import { requireUser } from "@/lib/auth/require-user";
import { fetchProfileById } from "@/lib/follows";
import { fetchItemsByTripId } from "@/lib/items/queries";
import {
  parseNavFrom,
  resolveTripBack,
} from "@/lib/navigation/context";
import { fetchRecommendationCountsForItems } from "@/lib/recommendations/queries";
import { tripSharePath } from "@/lib/share/paths";
import { fetchActiveTodosByTripId } from "@/lib/todos/queries";
import { fetchTripWithStatsById } from "@/lib/trips/detail";

export const dynamic = "force-dynamic";

type TripDetailPageProps = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function TripDetailPage({
  params,
  searchParams,
}: TripDetailPageProps) {
  const { tripId } = await params;
  const { from: fromRaw } = await searchParams;
  const from = parseNavFrom(fromRaw);
  const back = resolveTripBack(from);

  const { supabase, user } = await requireUser();
  const trip = await fetchTripWithStatsById(supabase, tripId);

  if (!trip) {
    notFound();
  }

  const isOwner = trip.userId === user.id;
  const showPublisher = from === "search";
  const publisherProfile = showPublisher
    ? await fetchProfileById(supabase, trip.userId)
    : null;
  const items = await fetchItemsByTripId(supabase, tripId);
  const todos = isOwner
    ? await fetchActiveTodosByTripId(supabase, tripId)
    : [];
  const publicItemIds =
    trip.visibility === "public"
      ? items.filter((item) => item.visibility === "public").map((item) => item.id)
      : [];
  const recommendationCountsByItemId =
    publicItemIds.length > 0
      ? await fetchRecommendationCountsForItems(supabase, publicItemIds)
      : undefined;
  const addItemHref = `/trips/${tripId}/items/new`;
  const addTodoHref = `/trips/${tripId}/todos/new`;
  const hasItems = items.length > 0;
  const hasTodos = todos.length > 0;
  // P6 → P7 → P5: items carry from=trip so P5 returns here with from=search.
  const itemNavFrom = from === "search" ? ("trip" as const) : undefined;

  return (
    <div className="min-h-screen">
      <Header email={user.email} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-10">
        <BackButton href={back.href} label={back.label} />

        <TripCover trip={trip} />

        {showPublisher && publisherProfile ? (
          <ContentPublisher
            userId={publisherProfile.id}
            displayName={publisherProfile.displayName}
          />
        ) : null}

        {trip.visibility === "public" || isOwner ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {trip.visibility === "public" ? (
              <ShareButton path={tripSharePath(tripId)} />
            ) : null}
            {isOwner ? (
              <TripDetailActions tripId={tripId} tripName={trip.name} />
            ) : null}
          </div>
        ) : null}

        {isOwner ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 font-stamp text-[11px] tracking-[0.22em] text-[var(--color-stamp)] uppercase">
                  Shopping Todo
                </p>
                <Heading level={2}>购物代办</Heading>
              </div>
              {hasTodos ? (
                <Link href={addTodoHref}>
                  <Button>添加购物代办</Button>
                </Link>
              ) : null}
            </div>
            <ShoppingTodoList
              tripId={tripId}
              todos={todos}
              emptyAction={
                <Link href={addTodoHref}>
                  <Button>添加购物代办</Button>
                </Link>
              }
            />
          </section>
        ) : null}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 font-stamp text-[11px] tracking-[0.22em] text-[var(--color-stamp)] uppercase">
              Purchases
            </p>
            <Heading level={2}>购买记录</Heading>
          </div>
          {isOwner && hasItems ? (
            <Link href={addItemHref}>
              <Button>添加商品</Button>
            </Link>
          ) : null}
        </section>

        <ItemGrid
          items={items}
          itemNavFrom={itemNavFrom}
          showItemVisibility={isOwner}
          recommendationCountsByItemId={recommendationCountsByItemId}
          emptyAction={
            isOwner ? (
              <Link href={addItemHref}>
                <Button>添加第一件商品</Button>
              </Link>
            ) : undefined
          }
        />
      </main>
    </div>
  );
}
