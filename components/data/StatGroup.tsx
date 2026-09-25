import type { ReactNode } from "react";

type StatGroupProps = {
  children: ReactNode;
  variant?: "Default" | "Compact";
  className?: string;
};

export function StatGroup({
  children,
  variant = "Default",
  className = "",
}: StatGroupProps) {
  const gap = variant === "Compact" ? "gap-3" : "gap-4 md:gap-6";

  return (
    <div
      className={`flex flex-wrap items-start ${gap} ${className}`}
      role="group"
    >
      {children}
    </div>
  );
}
