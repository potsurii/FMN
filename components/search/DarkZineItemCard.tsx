import Link from "next/link";
import { Tape } from "@/components/fmn/paper";
import { ItemImage } from "@/components/item/ItemImage";
import { FmnButton } from "@/components/ui/fmn-button";
import { FmnTag } from "@/components/ui/fmn-tag";
import { getCategoryLabel } from "@/lib/category";
import { formatMoney } from "@/lib/currency";
import { formatTripDateRange } from "@/lib/dates";
import { itemHref, type ItemNavFrom } from "@/lib/navigation/context";
import type { RecommendationCounts } from "@/lib/recommendations/types";
import type { ItemWithDisplay } from "@/lib/items/types";

type DarkZineItemCardProps = {
  item: ItemWithDisplay;
  recommendationCounts?: RecommendationCounts | null;
  navFrom?: ItemNavFrom;
  href?: string;
  className?: string;
};

const ticketOnDark =
  "pointer-events-none border-paper/40 text-paper-hi hover:border-paper/40 hover:text-paper-hi";

export function DarkZineItemCard({
  item,
  recommendationCounts = null,
  navFrom,
  href,
  className = "",
}: DarkZineItemCardProps) {
  const showSummary =
    item.visibility === "public" && recommendationCounts !== null;
  const linkHref =
    href ??
    itemHref(item.tripId, item.id, navFrom ? { from: navFrom } : undefined);

  return (
    <Link
      href={linkHref}
      className={`group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vermilion-hi ${className}`}
    >
      <article className="border-2 border-dashed border-paper/25 bg-ink-2/80 p-3 text-paper-hi md:p-4">
        <figure className="paper-hi shadow-paper relative mx-auto mb-4 w-[78%] p-2 pb-3">
          <Tape className="-top-2.5 left-1/2 -translate-x-1/2 -rotate-2" />
          <ItemImage
            src={item.imageUrl}
            alt={`${item.name} product image`}
            className="aspect-[4/5]"
          />
        </figure>
        <h3
          className="font-display truncate text-lg leading-tight font-bold"
          title={item.name}
        >
          {item.name}
        </h3>
        <p className="mt-1.5 font-mono text-sm">
          {formatMoney(item.price, item.currency)}
          <span className="ml-1 text-[0.65rem] tracking-[0.12em] text-paper/70 uppercase">
            {item.currency}
          </span>
        </p>
        <p className="mt-1 font-mono text-[0.72rem] text-paper/75">{item.location}</p>
        <p className="font-mono text-[0.72rem] text-paper/55">
          {formatTripDateRange(item.purchaseDate, item.purchaseDate)}
        </p>
        <div className="mt-3">
          <FmnTag className="border-paper/50 text-paper-hi">
            {getCategoryLabel(item.category)}
          </FmnTag>
        </div>
        {showSummary ? (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="推荐反馈数量">
            <FmnButton variant="ticket" tabIndex={-1} className={ticketOnDark}>
              推荐 {recommendationCounts.recommendCount}
            </FmnButton>
            <FmnButton variant="ticket" tabIndex={-1} className={ticketOnDark}>
              不推荐 {recommendationCounts.notRecommendCount}
            </FmnButton>
          </div>
        ) : null}
      </article>
    </Link>
  );
}
