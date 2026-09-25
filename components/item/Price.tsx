import { formatMoney } from "@/lib/currency";

type PriceProps = {
  amount: number;
  currency: string;
  className?: string;
};

export function Price({ amount, currency, className = "" }: PriceProps) {
  return (
    <span className={`font-semibold text-[var(--color-ink)] ${className}`}>
      {formatMoney(amount, currency)}
      <span className="ml-1 font-stamp text-[10px] tracking-[0.12em] font-normal text-[var(--color-ink-muted)] uppercase">
        {currency}
      </span>
    </span>
  );
}
