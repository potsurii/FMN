import Link from "next/link";
import { Tape } from "@/components/fmn/paper";
import { ItemImage } from "@/components/item/ItemImage";
import { FmnButton } from "@/components/ui/fmn-button";
import { FmnPaperCard } from "@/components/ui/fmn-paper-card";
import { FmnTag } from "@/components/ui/fmn-tag";
import { getCategoryLabel } from "@/lib/category";
import { formatMoney } from "@/lib/currency";
import { formatTripDateRange } from "@/lib/dates";
import { itemHref, type ItemNavFrom } from "@/lib/navigation/context";
import type { RecommendationCounts } from "@/lib/recommendations/types";
import type { ItemWithDisplay } from "@/lib/items/types";
import { visibilityLabel } from "@/lib/trips/labels";

type ZineItemCardProps = {
  item: ItemWithDisplay;
  recommendationCounts?: RecommendationCounts | null;
  /** Navigation context for detail back/active (e.g. search). */
  navFrom?: ItemNavFrom;
  href?: string;
  /** Show 公开/私密 next to price (owner trip / own item views). */
  showVisibility?: boolean;
  className?: string;
};

export function ZineItemCard({
  item,
  recommendationCounts = null,
  navFrom,
  href,
  showVisibility = false,
  className = "",
}: ZineItemCardProps) {
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
      <FmnPaperCard className="p-3 md:p-4">
        <figure className="paper-hi shadow-paper relative mx-auto mb-4 w-[78%] p-2 pb-3">
          <Tape className="-top-2.5 left-1/2 -translate-x-1/2 -rotate-2" />
          <ItemImage
            src={item.imageUrl}
            alt={`${item.name} product image`}
            className="aspect-[4/5]"
          />
        </figure>

        <h3
          className="font-display truncate text-lg leading-tight font-bold text-ink"
          title={item.name}
        >
          {item.name}
        </h3>
        <p className="mt-1.5 font-mono text-sm text-ink">
          {formatMoney(item.price, item.currency)}
          <span className="ml-1 text-[0.65rem] tracking-[0.12em] uppercase">
            {item.currency}
          </span>
          {showVisibility ? (
            <span className="ml-2 text-[0.65rem] tracking-[0.12em] text-ink/60 uppercase">
              {visibilityLabel(item.visibility)}
            </span>
          ) : null}
        </p>
        <p className="mt-1 font-mono text-[0.72rem] text-ink/70">{item.location}</p>
        <p className="font-mono text-[0.72rem] text-ink/55">
          {formatTripDateRange(item.purchaseDate, item.purchaseDate)}
        </p>

        <div className="mt-3">
          <FmnTag>{getCategoryLabel(item.category)}</FmnTag>
        </div>

        {showSummary ? (
          <div
            className="mt-3 flex flex-wrap gap-2"
            aria-label="推荐反馈数量"
          >
            <FmnButton
              variant="ticket"
              tabIndex={-1}
              className="pointer-events-none"
            >
              推荐 {recommendationCounts.recommendCount}
            </FmnButton>
            <FmnButton
              variant="ticket"
              tabIndex={-1}
              className="pointer-events-none"
            >
              不推荐 {recommendationCounts.notRecommendCount}
            </FmnButton>
          </div>
        ) : null}
      </FmnPaperCard>
    </Link>
  );
}
