import { Stat } from "@/components/data/Stat";
import { StatGroup } from "@/components/data/StatGroup";
import { TotalSpend } from "@/components/data/TotalSpend";
import type { CurrencySpend } from "@/lib/trips/types";

type TripStatsProps = {
  spendByCurrency: CurrencySpend[];
  itemCount: number;
  categoryCount: number;
  variant?: "Default" | "Compact";
  className?: string;
};

export function TripStats({
  spendByCurrency,
  itemCount,
  categoryCount,
  variant = "Default",
  className = "",
}: TripStatsProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <TotalSpend
        spendByCurrency={spendByCurrency}
        variant={variant === "Compact" ? "Default" : "Default"}
      />
      <StatGroup variant={variant === "Compact" ? "Compact" : "Default"}>
        <Stat
          label="Items"
          value={String(itemCount)}
          variant={variant === "Compact" ? "Compact" : "Default"}
        />
        <Stat
          label="Categories"
          value={String(categoryCount)}
          variant={variant === "Compact" ? "Compact" : "Default"}
        />
      </StatGroup>
    </div>
  );
}
