import Link from "next/link";
import { Image } from "@/components/foundation/Image";
import { Text } from "@/components/foundation/Text";
import { RecommendationFeedback } from "@/components/recommendation/RecommendationFeedback";
import { formatTripDateRange } from "@/lib/dates";
import { itemHref, tripHref } from "@/lib/navigation/context";
import type { RecommendationCounts } from "@/lib/recommendations/types";
import type {
  ProfileSearchResult,
  PublicItemSearchResult,
  PublicTripSearchResult,
} from "@/lib/search/types";

type ProductCardProps = {
  variant: "product";
  item: PublicItemSearchResult;
  recommendationCounts: RecommendationCounts;
  className?: string;
};

type TravelCardProps = {
  variant: "travel";
  trip: PublicTripSearchResult;
  className?: string;
};

type UserCardProps = {
  variant: "user";
  profile: ProfileSearchResult;
  className?: string;
};

type SearchResultCardProps = ProductCardProps | TravelCardProps | UserCardProps;

export function SearchResultCard(props: SearchResultCardProps) {
  if (props.variant === "product") {
    return (
      <ProductResult
        item={props.item}
        recommendationCounts={props.recommendationCounts}
        className={props.className}
      />
    );
  }
  if (props.variant === "travel") {
    return <TravelResult trip={props.trip} className={props.className} />;
  }
  return <UserResult profile={props.profile} className={props.className} />;
}

function ProductResult({
  item,
  recommendationCounts,
  className = "",
}: {
  item: PublicItemSearchResult;
  recommendationCounts: RecommendationCounts;
  className?: string;
}) {
  return (
    <Link
      href={itemHref(item.tripId, item.id, { from: "search" })}
      className={`group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${className}`}
    >
      <article className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_20px_rgba(45,42,38,0.08)]">
        <div className="aspect-square overflow-hidden bg-[var(--color-paper-muted)]">
          <Image
            src={item.imageUrl}
            alt={`${item.name} product image`}
            fallback={<ImagePlaceholder label="No Photo" />}
          />
        </div>
        <div className="space-y-2 p-3 md:p-4">
          <h3 className="truncate font-semibold text-[var(--color-ink)]">
            {item.name}
          </h3>
          <Text as="p" className="text-sm text-[var(--color-ink)]">
            {formatPrice(item.price, item.currency)}
          </Text>
          <Text as="p" className="text-sm text-[var(--color-ink-muted)]">
            {item.location} · {item.purchaseDate}
          </Text>
          <RecommendationFeedback
            variant="summary"
            itemId={item.id}
            initialCounts={recommendationCounts}
          />
        </div>
      </article>
    </Link>
  );
}

function TravelResult({
  trip,
  className = "",
}: {
  trip: PublicTripSearchResult;
  className?: string;
}) {
  return (
    <Link
      href={tripHref(trip.id, { from: "search" })}
      className={`group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${className}`}
    >
      <article className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_20px_rgba(45,42,38,0.08)]">
        <div className="aspect-[4/3] overflow-hidden bg-[var(--color-paper-muted)]">
          <Image
            src={trip.mainImageUrl}
            alt={`${trip.name} cover`}
            fallback={<ImagePlaceholder label="Waiting for photo" />}
          />
        </div>
        <div className="space-y-1 p-3 md:p-4">
          <h3 className="truncate font-semibold text-[var(--color-ink)]">
            {trip.name}
          </h3>
          <Text as="p" className="text-sm text-[var(--color-ink-muted)]">
            {formatTripDateRange(trip.startDate, trip.endDate)}
          </Text>
        </div>
      </article>
    </Link>
  );
}

function UserResult({
  profile,
  className = "",
}: {
  profile: ProfileSearchResult;
  className?: string;
}) {
  return (
    <Link
      href={`/users/${profile.id}?from=search`}
      className={`group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${className}`}
    >
      <article className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4 transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_20px_rgba(45,42,38,0.08)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper-muted)] font-stamp text-xs tracking-wider text-[var(--color-stamp)] uppercase">
          {(profile.displayName || "?").slice(0, 1)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-[var(--color-ink)]">
            {profile.displayName || "旅行者"}
          </h3>
          <Text as="p" className="text-sm text-[var(--color-ink-muted)]">
            用户主页
          </Text>
        </div>
      </article>
    </Link>
  );
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,#f3efe6_0%,#e8e2d6_100%)]">
      <span className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-stamp)] uppercase">
        {label}
      </span>
    </div>
  );
}

function formatPrice(price: number, currency: string): string {
  return `${price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}
