type StatProps = {
  label: string;
  value: string;
  variant?: "Default" | "Large" | "Compact";
  className?: string;
};

export function Stat({
  label,
  value,
  variant = "Default",
  className = "",
}: StatProps) {
  const valueClass =
    variant === "Large"
      ? "text-xl font-semibold"
      : variant === "Compact"
        ? "text-sm font-semibold"
        : "text-base font-semibold";

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-ink-muted)] uppercase">
        {label}
      </span>
      <span className={`${valueClass} text-[var(--color-ink)]`}>{value}</span>
    </div>
  );
}
