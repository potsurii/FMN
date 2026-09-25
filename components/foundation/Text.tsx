import type { ReactNode } from "react";

type TextProps = {
  children: ReactNode;
  className?: string;
  as?: "p" | "span";
};

export function Text({ children, className = "", as: Tag = "p" }: TextProps) {
  return (
    <Tag className={`text-[15px] leading-relaxed text-[var(--color-ink)] ${className}`}>
      {children}
    </Tag>
  );
}
