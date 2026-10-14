import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type FmnButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "stamp" | "ticket";
};

const variantClass = {
  stamp:
    "bg-vermilion text-paper-hi hover:bg-vermilion-hi hover:text-ink font-display px-5 py-2.5 text-base font-bold",
  ticket:
    "border-2 border-dashed border-ink/50 bg-transparent font-mono text-[0.68rem] tracking-[0.18em] text-ink uppercase hover:border-vermilion hover:text-vermilion",
} as const;

const stampClip =
  "polygon(0 8%, 3% 0, 52% 4%, 100% 0, 98% 52%, 100% 100%, 46% 96%, 2% 100%, 0 50%)";

export function FmnButton({
  children,
  variant = "stamp",
  className,
  type = "button",
  style,
  ...props
}: FmnButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-3 py-2 transition-colors disabled:opacity-50",
        variantClass[variant],
        variant === "stamp" && "drop-paper",
        className,
      )}
      style={variant === "stamp" ? { ...style, clipPath: stampClip } : style}
      {...props}
    >
      {children}
    </button>
  );
}
