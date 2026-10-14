import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type FmnPaperCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Ticket-style dashed edge instead of the soft paper shadow. */
  dashed?: boolean;
};

export function FmnPaperCard({
  children,
  dashed = false,
  className,
  ...props
}: FmnPaperCardProps) {
  return (
    <div
      className={cn(
        "paper-hi text-ink",
        dashed
          ? "border-2 border-dashed border-ink/50 bg-paper-hi/55"
          : "shadow-paper",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
