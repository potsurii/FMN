import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export function Input({
  hasError = false,
  className = "",
  ...props
}: InputProps) {
  return (
    <input
      className={`w-full rounded-lg border bg-[var(--color-paper)] px-3 py-2.5 text-[15px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] ${
        hasError
          ? "border-red-500/70"
          : "border-[var(--color-line)]"
      } ${className}`}
      {...props}
    />
  );
}
