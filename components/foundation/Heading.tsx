import type { ReactNode } from "react";

type HeadingProps = {
  children: ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
};

const levelClass: Record<1 | 2 | 3, string> = {
  1: "text-3xl md:text-4xl font-semibold tracking-tight",
  2: "text-xl md:text-2xl font-semibold tracking-tight",
  3: "text-lg font-semibold tracking-tight",
};

export function Heading({ children, level = 1, className = "" }: HeadingProps) {
  const Tag = (`h${level}` as "h1" | "h2" | "h3");

  return (
    <Tag
      className={`${levelClass[level]} text-[var(--color-ink)] ${className}`}
    >
      {children}
    </Tag>
  );
}
