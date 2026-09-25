import { formatMoney } from "@/lib/currency";
import type { CurrencySpend } from "@/lib/trips/types";

type TotalSpendProps = {
  spendByCurrency: CurrencySpend[];
  variant?: "Default" | "Large";
  className?: string;
};

export function TotalSpend({
  spendByCurrency,
  variant = "Default",
  className = "",
}: TotalSpendProps) {
  const valueClass =
    variant === "Large" ? "text-xl font-semibold" : "text-base font-semibold";

  if (spendByCurrency.length === 0) {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        <span className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-ink-muted)] uppercase">
          Total Spend
        </span>
        <span className={`${valueClass} text-[var(--color-ink-muted)]`}>—</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-ink-muted)] uppercase">
        Total Spend
      </span>
      <ul className="flex flex-col gap-0.5">
        {spendByCurrency.map((row) => (
          <li key={row.currency} className="flex items-baseline gap-2">
            <span className={`${valueClass} text-[var(--color-ink)]`}>
              {formatMoney(row.total, row.currency)}
            </span>
            <span className="font-stamp text-[10px] tracking-[0.14em] text-[var(--color-ink-muted)] uppercase">
              {row.currency}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
