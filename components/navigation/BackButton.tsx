import Link from "next/link";

type BackButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

export function BackButton({
  href,
  label = "返回",
  className = "",
}: BackButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)] ${className}`}
    >
      <span aria-hidden>←</span>
      <span>{label}</span>
    </Link>
  );
}
