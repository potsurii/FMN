import { Location } from "@/components/item/Location";
import { Price } from "@/components/item/Price";
import { formatTripDateRange } from "@/lib/dates";
import { visibilityLabel } from "@/lib/trips/labels";
import type { Visibility } from "@/lib/items/types";

type ItemMetaProps = {
  name: string;
  price: number;
  currency: string;
  location: string;
  purchaseDate: string;
  /** When set, show 公开/私密 next to the price. */
  visibility?: Visibility;
  className?: string;
};

export function ItemMeta({
  name,
  price,
  currency,
  location,
  purchaseDate,
  visibility,
  className = "",
}: ItemMetaProps) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <h3
        className="truncate text-base font-semibold tracking-tight text-[var(--color-ink)]"
        title={name}
      >
        {name}
      </h3>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <Price amount={price} currency={currency} />
        {visibility ? (
          <span className="text-xs text-[var(--color-ink-muted)]">
            {visibilityLabel(visibility)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5">
        <Location value={location} />
        <span className="text-xs text-[var(--color-ink-muted)]">
          {formatTripDateRange(purchaseDate, purchaseDate)}
        </span>
      </div>
    </div>
  );
}
