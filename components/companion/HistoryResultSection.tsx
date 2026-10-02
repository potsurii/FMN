import { EmptyState } from "@/components/feedback/EmptyState";
import { ItemCard } from "@/components/item/ItemCard";
import type { ItemWithDisplay } from "@/lib/items/types";
import { OWN_HISTORY_LIMIT } from "@/lib/history/types";

type HistoryResultSectionProps = {
  summary: string;
  items: ItemWithDisplay[];
  hasMore: boolean;
};

/**
 * F3-02 read-only results inside Companion Surface.
 * Reuses ItemCard / EmptyState — no AI-parallel components.
 */
export function HistoryResultSection({
  summary,
  items,
  hasMore,
}: HistoryResultSectionProps) {
  return (
    <section
      className="space-y-3 rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)]/80 p-3"
      aria-label="历史购物查询结果"
    >
      <header className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-[var(--color-stamp)] uppercase">
          历史记录 · 只读
        </p>
        <p className="text-sm text-[var(--color-ink)]">查询条件：{summary}</p>
        <p className="text-xs text-[var(--color-ink-muted)]">
          这不是草稿，也不会写入正式记录。
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState variant="NoHistoryMatches" />
      ) : (
        <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} showVisibility />
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <p className="text-xs text-[var(--color-ink-muted)]">
          仅显示前 {OWN_HISTORY_LIMIT} 条（按购买日期倒序）。请缩小条件以查看更精确结果。
        </p>
      ) : null}
    </section>
  );
}
