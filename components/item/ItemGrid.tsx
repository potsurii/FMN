import { EmptyState } from "@/components/feedback/EmptyState";
import { ItemCard } from "@/components/item/ItemCard";
import type { ItemWithDisplay } from "@/lib/items/types";
import type { ReactNode } from "react";

type ItemGridProps = {
  items: ItemWithDisplay[];
  emptyAction?: ReactNode;
  className?: string;
};

export function ItemGrid({ items, emptyAction, className = "" }: ItemGridProps) {
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
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
