import Link from "next/link";
import { CategoryTag } from "@/components/item/CategoryTag";
import { ItemImage } from "@/components/item/ItemImage";
import { ItemMeta } from "@/components/item/ItemMeta";
import { RecommendationFeedback } from "@/components/recommendation/RecommendationFeedback";
import { itemHref, type ItemNavFrom } from "@/lib/navigation/context";
import type { RecommendationCounts } from "@/lib/recommendations/types";
import type { ItemWithDisplay } from "@/lib/items/types";

type ItemCardProps = {
  item: ItemWithDisplay;
  recommendationCounts?: RecommendationCounts | null;
  /** Navigation context for detail back/active (e.g. search). */
  navFrom?: ItemNavFrom;
  href?: string;
  /** Show 公开/私密 next to price (owner trip / own item views). */
  showVisibility?: boolean;
  className?: string;
};

export function ItemCard({
  item,
  recommendationCounts = null,
  navFrom,
  href,
  showVisibility = false,
  className = "",
}: ItemCardProps) {
  const showSummary =
    item.visibility === "public" && recommendationCounts !== null;
  const linkHref =
    href ??
    itemHref(item.tripId, item.id, navFrom ? { from: navFrom } : undefined);

  return (
    <Link
      href={linkHref}
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
            visibility={showVisibility ? item.visibility : undefined}
          />
          <CategoryTag slug={item.category} />
          {showSummary ? (
            <RecommendationFeedback
              variant="summary"
              itemId={item.id}
              initialCounts={recommendationCounts}
            />
          ) : null}
        </div>
      </article>
    </Link>
  );
}
