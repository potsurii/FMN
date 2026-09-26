import Link from "next/link";
import { Image } from "@/components/foundation/Image";
import { Text } from "@/components/foundation/Text";
import { TravelStamp } from "@/components/travel/TravelStamp";
import { TripStats } from "@/components/travel/TripStats";
import { formatStampDate, formatTripDateRange } from "@/lib/dates";
import {
  travelStatusLabel,
  visibilityLabel,
} from "@/lib/trips/labels";
import type { TripWithStats } from "@/lib/trips/types";

type TripCardProps = {
  trip: TripWithStats;
  href?: string;
  /** P1 archive shows visibility; P6 discovery hides it. Default true. */
  showVisibility?: boolean;
  className?: string;
};

function TripImagePlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(145deg,#f3efe6_0%,#e8e2d6_100%)]">
      <div className="rotate-[-4deg] border border-dashed border-[var(--color-stamp)]/50 px-3 py-2 font-stamp text-[10px] tracking-[0.2em] text-[var(--color-stamp)] uppercase">
        Waiting for photo
      </div>
      <span className="text-xs text-[var(--color-ink-muted)]">旅行主图留白</span>
    </div>
  );
}

export function TripCard({
  trip,
  href,
  showVisibility = true,
  className = "",
}: TripCardProps) {
  const dateRange = formatTripDateRange(trip.startDate, trip.endDate);
  const stampDate = formatStampDate(trip.startDate, trip.endDate);

  return (
    <Link
      href={href ?? `/trips/${trip.id}`}
      className={`group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${className}`}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[0_1px_0_rgba(45,42,38,0.04),0_8px_24px_rgba(45,42,38,0.04)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_2px_0_rgba(45,42,38,0.05),0_14px_28px_rgba(45,42,38,0.08)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-paper-muted)]">
          <Image
            src={trip.mainImageUrl}
            alt={`${trip.name} main image`}
            fallback={<TripImagePlaceholder />}
          />
          <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)]">
            <TravelStamp name={trip.name} dateLabel={stampDate} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
          <div className="min-w-0 space-y-1">
            <h3
              className="truncate text-lg font-semibold tracking-tight text-[var(--color-ink)]"
              title={trip.name}
            >
              {trip.name}
            </h3>
            <Text as="span" className="text-sm text-[var(--color-ink-muted)]">
              {showVisibility ? (
                <>
                  {visibilityLabel(trip.visibility)}
                  {" · "}
                </>
              ) : null}
              {travelStatusLabel(trip.travelStatus)}
            </Text>
            <Text as="span" className="text-sm text-[var(--color-ink-muted)]">
              {dateRange}
            </Text>
          </div>

          <div className="mt-auto border-t border-[var(--color-line)] pt-3">
            <TripStats
              spendByCurrency={trip.spendByCurrency}
              itemCount={trip.itemCount}
              categoryCount={trip.categoryCount}
              variant="Compact"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
