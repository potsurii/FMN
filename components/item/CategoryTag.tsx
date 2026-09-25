import { getCategoryLabel } from "@/lib/category";

type CategoryTagProps = {
  slug: string;
  className?: string;
};

export function CategoryTag({ slug, className = "" }: CategoryTagProps) {
  return (
    <span
      className={`inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-2.5 py-0.5 text-xs text-[var(--color-ink)] ${className}`}
    >
      {getCategoryLabel(slug)}
    </span>
  );
}
