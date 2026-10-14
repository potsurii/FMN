import Link from "next/link";
import { Tape } from "@/components/fmn/paper";
import { Image } from "@/components/foundation/Image";
import { FmnButton } from "@/components/ui/fmn-button";
import { FmnTag } from "@/components/ui/fmn-tag";
import { getCategoryLabel } from "@/lib/category";
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
      <article className="border-2 border-dashed border-paper/25 bg-ink-2/80 p-3 text-paper-hi md:p-4">
        <figure className="paper-hi shadow-paper relative mx-auto mb-4 w-[78%] p-2 pb-3">
          <Tape className="-top-2.5 left-1/2 -translate-x-1/2 -rotate-2" />
          <div className="aspect-[4/5] overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={`${item.name} product image`}
              fallback={<ImagePlaceholder label="No Photo" />}
            />
          </div>
        </figure>
        <h3 className="font-display truncate text-lg leading-tight font-bold">
          {item.name}
        </h3>
        <p className="mt-1.5 font-mono text-sm">
          {formatPrice(item.price, item.currency)}
        </p>
        <p className="mt-1 font-mono text-[0.72rem] text-paper/75">
          {item.location}
        </p>
        <p className="font-mono text-[0.72rem] text-paper/55">
          {item.purchaseDate}
        </p>
        <div className="mt-3">
          <FmnTag className="border-paper/50 text-paper-hi">
            {getCategoryLabel(item.category)}
          </FmnTag>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="推荐反馈数量">
          <FmnButton
            variant="ticket"
            tabIndex={-1}
            className="pointer-events-none border-paper/40 text-paper-hi hover:border-paper/40 hover:text-paper-hi"
          >
            推荐 {recommendationCounts.recommendCount}
          </FmnButton>
          <FmnButton
            variant="ticket"
            tabIndex={-1}
            className="pointer-events-none border-paper/40 text-paper-hi hover:border-paper/40 hover:text-paper-hi"
          >
            不推荐 {recommendationCounts.notRecommendCount}
          </FmnButton>
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
      <article className="border-2 border-dashed border-paper/25 bg-ink-2/80 p-3 text-paper-hi md:p-4">
        <figure className="paper-hi shadow-paper relative mx-auto mb-4 w-[78%] p-2 pb-3">
          <Tape className="-top-2.5 left-1/2 -translate-x-1/2 -rotate-2" />
          <div className="aspect-[4/3] overflow-hidden">
            <Image
              src={trip.mainImageUrl}
              alt={`${trip.name} cover`}
              fallback={<ImagePlaceholder label="Waiting for photo" />}
            />
          </div>
        </figure>
        <h3 className="font-display truncate text-lg leading-tight font-bold">
          {trip.name}
        </h3>
        <p className="mt-1 font-mono text-[0.72rem] text-paper/75">
          {formatTripDateRange(trip.startDate, trip.endDate)}
        </p>
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
      <article className="flex items-center gap-3 border-2 border-dashed border-paper/25 bg-ink-2/80 p-4 text-paper-hi">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-dashed border-paper/40 font-mono text-xs tracking-wider text-paper-hi uppercase">
          {(profile.displayName || "?").slice(0, 1)}
        </div>
        <div className="min-w-0">
          <h3 className="font-display truncate text-lg leading-tight font-bold">
            {profile.displayName || "旅行者"}
          </h3>
          <p className="font-mono text-[0.72rem] text-paper/70">用户主页</p>
        </div>
      </article>
    </Link>
  );
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ink-3">
      <span className="font-mono text-[10px] tracking-[0.18em] text-paper/70 uppercase">
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
