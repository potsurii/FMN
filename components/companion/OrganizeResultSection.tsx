import { Stat } from "@/components/data/Stat";
import { StatGroup } from "@/components/data/StatGroup";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ItemCard } from "@/components/item/ItemCard";
import { formatMoney } from "@/lib/currency";
import type { OrganizeResultView } from "@/lib/workflows/organize/types";

type OrganizeResultSectionProps = {
  view: OrganizeResultView;
};

/**
 * F3-03 structured organize results.
 * Stats computed in workflow; UI only displays.
 * Record Count and Quantity are separate fields.
 */
export function OrganizeResultSection({ view }: OrganizeResultSectionProps) {
  return (
    <section
      className="space-y-4 rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)]/80 p-3"
      aria-label="购物数据整理结果"
    >
      <header className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-[var(--color-stamp)] uppercase">
          整理 · 只读
        </p>
        <p className="text-sm text-[var(--color-ink)]">{view.summary}</p>
        <p className="text-xs text-[var(--color-ink-muted)]">
          不会创建或修改正式购物记录。金额按币种独立汇总，不做汇率换算。
        </p>
      </header>

      <StatGroup variant="Compact">
        <Stat
          label="Record Count（记录条数）"
          value={String(view.recordCount)}
          variant="Compact"
        />
        <Stat
          label="Quantity（数量合计）"
          value={String(view.quantitySum)}
          variant="Compact"
        />
      </StatGroup>

      {view.totalsByCurrency.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-ink)]">
            各币种金额（独立，不跨币种）
          </p>
          <StatGroup variant="Compact">
            {view.totalsByCurrency.map((t) => (
              <Stat
                key={t.currency}
                label={`${t.currency} 合计`}
                value={formatMoney(t.totalAmount, t.currency)}
                variant="Compact"
              />
            ))}
          </StatGroup>
        </div>
      ) : null}

      {view.recordCount === 0 ? (
        <EmptyState variant="NoHistoryMatches" />
      ) : view.groups ? (
        <div className="space-y-4">
          {view.groups.map((g) => (
            <div key={g.key} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-line)] pb-1">
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                  {g.label}
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  记录 {g.recordCount} · 数量 {g.quantitySum}
                  {g.totalsByCurrency.length > 0
                    ? ` · ${g.totalsByCurrency
                        .map((t) => formatMoney(t.totalAmount, t.currency))
                        .join(" / ")}`
                    : ""}
                </p>
              </div>
              <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
                {g.items.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <ItemCard item={item} showVisibility />
                  </li>
                ))}
              </ul>
              {g.items.length > 6 ? (
                <p className="text-xs text-[var(--color-ink-muted)]">
                  本组另有 {g.items.length - 6} 条未全部展开。
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
          {view.items.slice(0, 12).map((item) => (
            <li key={item.id}>
              <ItemCard item={item} showVisibility />
            </li>
          ))}
        </ul>
      )}

      {view.hasMore ? (
        <p className="text-xs text-[var(--color-ink-muted)]">
          结果已截断至整理上限。请缩小条件以查看更精确范围。
        </p>
      ) : null}
    </section>
  );
}
