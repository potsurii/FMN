import { EmptyState } from "@/components/feedback/EmptyState";
import { ZineItemCard } from "@/components/item/ZineItemCard";
import type { ItemNavFrom } from "@/lib/navigation/context";
import type { RecommendationCounts } from "@/lib/recommendations/types";
import type { ItemWithDisplay } from "@/lib/items/types";
import type { ReactNode } from "react";

type ItemGridProps = {
  items: ItemWithDisplay[];
  recommendationCountsByItemId?: Map<string, RecommendationCounts>;
  /** When set (e.g. from=search trip view), item links carry from=trip. */
  itemNavFrom?: ItemNavFrom;
  /** Owner trip detail: show 公开/私密 on cards. */
  showItemVisibility?: boolean;
  emptyAction?: ReactNode;
  className?: string;
};

export function ItemGrid({
  items,
  recommendationCountsByItemId,
  itemNavFrom,
  showItemVisibility = false,
  emptyAction,
  className = "",
}: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className={className}>
        <EmptyState variant="NoItems" />
        {emptyAction ? (
          <div className="mt-4 flex justify-center">{emptyAction}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {items.map((item) => (
        <ZineItemCard
          key={item.id}
          item={item}
          navFrom={itemNavFrom}
          showVisibility={showItemVisibility}
          recommendationCounts={
            item.visibility === "public"
              ? (recommendationCountsByItemId?.get(item.id) ?? {
                  recommendCount: 0,
                  notRecommendCount: 0,
                })
              : null
          }
        />
      ))}
    </div>
  );
}
