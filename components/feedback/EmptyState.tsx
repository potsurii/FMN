import type { ReactNode } from "react";

type EmptyStateProps = {
  variant?: "NoTrips" | "NoItems" | "NoTodoItems" | "NoHistoryMatches";
  className?: string;
  action?: ReactNode;
};

export function EmptyState({
  variant = "NoTrips",
  className = "",
  action,
}: EmptyStateProps) {
  const copy =
    variant === "NoTrips"
      ? {
          stamp: "EMPTY ARCHIVE",
          title: "还没有旅行",
          body: "创建第一段旅行，开始记录你的购物足迹。",
        }
      : variant === "NoTodoItems"
        ? {
            stamp: "SHOPPING TODO",
            title: "还没有购物代办",
            body: "记下准备购买的商品，出行时按清单采购。",
          }
        : variant === "NoHistoryMatches"
          ? {
              stamp: "NO MATCH",
              title: "没有找到符合条件的记录",
              body: "请调整商品名、分类、地点、日期或旅行后再试。不会虚构结果。",
            }
          : {
              stamp: "EMPTY PAGE",
              title: "还没有商品记录",
              body: "添加商品后，购买记录会出现在这里。",
            };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[var(--radius-paper)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-16 text-center ${className}`}
    >
      <div className="mb-6 rotate-[-3deg] border-2 border-dashed border-[var(--color-stamp)] px-4 py-3 font-stamp text-xs tracking-[0.22em] text-[var(--color-stamp)] uppercase">
        {copy.stamp}
      </div>
      <h2 className="mb-2 text-xl font-semibold text-[var(--color-ink)]">
        {copy.title}
      </h2>
      <p className="max-w-sm text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
        {copy.body}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
