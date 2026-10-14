import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type FmnTagProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: "ink" | "stamp";
};

export function FmnTag({
  children,
  tone = "ink",
  className,
  ...props
}: FmnTagProps) {
  return (
    <span
      className={cn(
        "inline-flex border px-1.5 py-0.5 font-mono text-[0.58rem] tracking-[0.18em] uppercase",
        tone === "stamp"
          ? "border-vermilion text-vermilion"
          : "border-ink/60 text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
