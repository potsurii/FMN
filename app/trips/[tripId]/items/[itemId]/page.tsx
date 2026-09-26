import { notFound } from "next/navigation";
import { Heading } from "@/components/foundation/Heading";
import { ShareButton } from "@/components/foundation/ShareButton";
import { Text } from "@/components/foundation/Text";
import { CategoryTag } from "@/components/item/CategoryTag";
import { ItemDetailActions } from "@/components/item/ItemDetailActions";
import { ItemImage } from "@/components/item/ItemImage";
import { ItemMeta } from "@/components/item/ItemMeta";
import { BackButton } from "@/components/navigation/BackButton";
import { Header } from "@/components/navigation/Header";
import { RecommendationFeedback } from "@/components/recommendation/RecommendationFeedback";
import { ContentPublisher } from "@/components/user/ContentPublisher";
import { requireUser } from "@/lib/auth/require-user";
import { fetchProfileById } from "@/lib/follows";
import { fetchItemById } from "@/lib/items/detail";
import {
  parseNavFrom,
  resolveItemBack,
} from "@/lib/navigation/context";
import {
  fetchMyRecommendation,
  fetchRecommendationCounts,
} from "@/lib/recommendations/queries";
import { itemSharePath } from "@/lib/share/paths";
import { fetchTripById } from "@/lib/trips/detail";

export const dynamic = "force-dynamic";

type ItemDetailPageProps = {
  params: Promise<{ tripId: string; itemId: string }>;
  searchParams: Promise<{ from?: string; tripId?: string }>;
};

export default async function ItemDetailPage({
  params,
  searchParams,
}: ItemDetailPageProps) {
  const { tripId, itemId } = await params;
  const { from: fromRaw } = await searchParams;
  const from = parseNavFrom(fromRaw);
  const back = resolveItemBack(from, tripId);

  const { supabase, user } = await requireUser();
  const [trip, item] = await Promise.all([
    fetchTripById(supabase, tripId),
    fetchItemById(supabase, tripId, itemId),
  ]);

  if (!trip || !item) {
    notFound();
  }

  const isOwner = trip.user_id === user.id;
  // Discovery from P6: from=search (direct) or from=trip (via public trip).
  const showPublisher = from === "search" || from === "trip";
  const isPubliclyRecommendable =
    item.visibility === "public" && trip.visibility === "public";
  const canShare = isPubliclyRecommendable;

  const [counts, myState, publisherProfile] = await Promise.all([
    isPubliclyRecommendable
      ? fetchRecommendationCounts(supabase, itemId)
      : Promise.resolve({ recommendCount: 0, notRecommendCount: 0 }),
    isPubliclyRecommendable && !isOwner
      ? fetchMyRecommendation(supabase, itemId, user.id)
      : Promise.resolve(null),
    showPublisher
      ? fetchProfileById(supabase, trip.user_id)
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen">
      <Header email={user.email} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6 md:py-10">
        <BackButton href={back.href} label={back.label} />

        <section className="overflow-hidden rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[0_8px_24px_rgba(45,42,38,0.05)]">
          <ItemImage
            src={item.imageUrl}
            alt={`${item.name} product image`}
            className="aspect-[4/3] max-h-[420px]"
          />
          <div className="space-y-5 p-4 md:p-6">
            <div>
              <p className="mb-2 font-stamp text-[11px] tracking-[0.22em] text-[var(--color-stamp)] uppercase">
                Item Detail
              </p>
              <Heading level={1} className="mb-1 text-2xl md:text-3xl">
                {item.name}
              </Heading>
              <Text className="text-sm text-[var(--color-ink-muted)]">
                {trip.name}
              </Text>
              {showPublisher && publisherProfile ? (
                <ContentPublisher
                  userId={publisherProfile.id}
                  displayName={publisherProfile.displayName}
                  className="mt-2"
                />
              ) : null}
            </div>

            <ItemMeta
              name={item.name}
              price={item.price}
              currency={item.currency}
              location={item.location}
              purchaseDate={item.purchaseDate}
              visibility={isOwner ? item.visibility : undefined}
            />

            <CategoryTag slug={item.category} />

            <div className="border-t border-[var(--color-line)] pt-4">
              <p className="mb-1 font-stamp text-[10px] tracking-[0.18em] text-[var(--color-ink-muted)] uppercase">
                Note
              </p>
              {item.note ? (
                <p className="text-[15px] leading-relaxed text-[var(--color-ink)]">
                  {item.note}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-ink-muted)]">无备注</p>
              )}
            </div>

            {isPubliclyRecommendable ? (
              <div className="border-t border-[var(--color-line)] pt-4">
                {isOwner ? (
                  <RecommendationFeedback
                    variant="summary"
                    itemId={itemId}
                    initialCounts={counts}
                  />
                ) : (
                  <RecommendationFeedback
                    variant="interactive"
                    itemId={itemId}
                    userId={user.id}
                    initialCounts={counts}
                    initialMyState={myState}
                  />
                )}
              </div>
            ) : null}

            {canShare || isOwner ? (
              <div className="flex flex-col gap-3 border-t border-[var(--color-line)] pt-4 sm:flex-row sm:flex-wrap">
                {canShare ? (
                  <ShareButton path={itemSharePath(tripId, itemId)} />
                ) : null}
                {isOwner ? (
                  <ItemDetailActions
                    tripId={tripId}
                    itemId={itemId}
                    itemName={item.name}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
