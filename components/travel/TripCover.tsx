import { Image } from "@/components/foundation/Image";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { TravelStamp } from "@/components/travel/TravelStamp";
import { TripStats } from "@/components/travel/TripStats";
import { formatStampDate, formatTripDateRange } from "@/lib/dates";
import {
  travelStatusLabel,
  visibilityLabel,
} from "@/lib/trips/labels";
import type { TripWithStats } from "@/lib/trips/types";

type TripCoverProps = {
  trip: TripWithStats;
  className?: string;
};

function CoverPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(145deg,#f3efe6_0%,#e8e2d6_100%)]">
      <div className="rotate-[-4deg] border border-dashed border-[var(--color-stamp)]/50 px-3 py-2 font-stamp text-[10px] tracking-[0.2em] text-[var(--color-stamp)] uppercase">
        Waiting for photo
      </div>
      <span className="text-xs text-[var(--color-ink-muted)]">旅行主图留白</span>
    </div>
  );
}

export function TripCover({ trip, className = "" }: TripCoverProps) {
  const dateRange = formatTripDateRange(trip.startDate, trip.endDate);
  const stampDate = formatStampDate(trip.startDate, trip.endDate);

  return (
    <section
      className={`overflow-hidden rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[0_8px_24px_rgba(45,42,38,0.05)] ${className}`}
    >
      <div className="relative aspect-[16/9] min-h-[200px] overflow-hidden bg-[var(--color-paper-muted)] md:aspect-[21/9]">
        <Image
          src={trip.mainImageUrl}
          alt={`${trip.name} cover`}
          fallback={<CoverPlaceholder />}
        />
        <div className="pointer-events-none absolute left-4 top-4 max-w-[min(100%-2rem,20rem)]">
          <TravelStamp name={trip.name} dateLabel={stampDate} />
        </div>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        <div className="space-y-1">
          <Heading level={1} className="text-2xl md:text-3xl">
            {trip.name}
          </Heading>
          <Text className="text-[var(--color-ink-muted)]">{dateRange}</Text>
          <Text className="text-sm text-[var(--color-ink-muted)]">
            目的地：
            {trip.destination?.trim() ? trip.destination.trim() : "未填写"}
          </Text>
          <Text className="text-sm text-[var(--color-ink-muted)]">
            {visibilityLabel(trip.visibility)}
            {" · "}
            {travelStatusLabel(trip.travelStatus)}
          </Text>
        </div>
        <TripStats
          spendByCurrency={trip.spendByCurrency}
          itemCount={trip.itemCount}
          categoryCount={trip.categoryCount}
        />
      </div>
    </section>
  );
}
