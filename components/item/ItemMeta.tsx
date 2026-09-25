import { Location } from "@/components/item/Location";
import { Price } from "@/components/item/Price";
import { formatTripDateRange } from "@/lib/dates";

type ItemMetaProps = {
  name: string;
  price: number;
  currency: string;
  location: string;
  purchaseDate: string;
  className?: string;
};

export function ItemMeta({
  name,
  price,
  currency,
  location,
  purchaseDate,
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
      <Price amount={price} currency={currency} />
      <div className="flex flex-col gap-0.5">
        <Location value={location} />
        <span className="text-xs text-[var(--color-ink-muted)]">
          {formatTripDateRange(purchaseDate, purchaseDate)}
        </span>
      </div>
    </div>
  );
}
