type LocationProps = {
  value: string;
  className?: string;
};

export function Location({ value, className = "" }: LocationProps) {
  return (
    <span className={`text-sm text-[var(--color-ink-muted)] ${className}`}>
      {value}
    </span>
  );
}
