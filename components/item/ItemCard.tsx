import Link from "next/link";
import { CategoryTag } from "@/components/item/CategoryTag";
import { ItemImage } from "@/components/item/ItemImage";
import { ItemMeta } from "@/components/item/ItemMeta";
import type { ItemWithDisplay } from "@/lib/items/types";

type ItemCardProps = {
  item: ItemWithDisplay;
  className?: string;
};

export function ItemCard({ item, className = "" }: ItemCardProps) {
  return (
    <Link
      href={`/trips/${item.tripId}/items/${item.id}`}
      className={`group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${className}`}
    >
      <article className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[0_1px_0_rgba(45,42,38,0.04)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_20px_rgba(45,42,38,0.08)]">
        <ItemImage src={item.imageUrl} alt={`${item.name} product image`} />
        <div className="space-y-3 p-3 md:p-4">
          <ItemMeta
            name={item.name}
            price={item.price}
            currency={item.currency}
            location={item.location}
            purchaseDate={item.purchaseDate}
          />
          <CategoryTag slug={item.category} />
        </div>
      </article>
    </Link>
  );
}
