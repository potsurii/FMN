import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export function Textarea({
  hasError = false,
  className = "",
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`w-full resize-y rounded-lg border bg-[var(--color-paper)] px-3 py-2.5 text-[15px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] ${
        hasError
          ? "border-red-500/70"
          : "border-[var(--color-line)]"
      } ${className}`}
      {...props}
    />
  );
}
