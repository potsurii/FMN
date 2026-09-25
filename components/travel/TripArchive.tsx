import type { ReactNode } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Heading } from "@/components/foundation/Heading";
import { TripCard } from "@/components/travel/TripCard";
import type { TripWithStats } from "@/lib/trips/types";

type TripArchiveProps = {
  trips: TripWithStats[];
  emptyAction?: ReactNode;
  className?: string;
};

export function TripArchive({
  trips,
  emptyAction,
  className = "",
}: TripArchiveProps) {
  return (
    <section className={`space-y-6 ${className}`} aria-label="Trip archive">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-stamp text-[11px] tracking-[0.22em] text-[var(--color-stamp)] uppercase">
            Collection
          </p>
          <Heading level={2}>旅行档案</Heading>
        </div>
        {trips.length > 0 ? (
          <span className="pb-1 font-stamp text-[11px] tracking-[0.16em] text-[var(--color-ink-muted)] uppercase">
            {trips.length} {trips.length === 1 ? "Trip" : "Trips"}
          </span>
        ) : null}
      </div>

      {trips.length === 0 ? (
        <EmptyState variant="NoTrips" action={emptyAction} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </section>
  );
}
