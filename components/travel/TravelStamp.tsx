type TravelStampProps = {
  /** Full trip name — never mutate; CSS truncates when space is tight */
  name: string;
  dateLabel: string;
  className?: string;
};

export function TravelStamp({ name, dateLabel, className = "" }: TravelStampProps) {
  return (
    <div
      className={`inline-flex max-w-full rotate-[-2deg] flex-col gap-1 border-2 border-dashed border-[var(--color-stamp)] bg-[var(--color-paper)] px-3 py-2 shadow-[1px_1px_0_rgba(45,42,38,0.08)] ${className}`}
    >
      <span
        className="block max-w-full truncate font-stamp text-[11px] tracking-[0.16em] text-[var(--color-stamp)] uppercase"
        title={name}
      >
        {name}
      </span>
      <span className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-ink-muted)] uppercase">
        {dateLabel}
      </span>
    </div>
  );
}
