import type { ReactNode } from "react";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";

type SearchResultGroupProps = {
  title: string;
  stamp?: string;
  emptyMessage?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SearchResultGroup({
  title,
  stamp,
  emptyMessage = "没有找到相关结果。",
  action,
  children,
  className = "",
}: SearchResultGroupProps) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {stamp ? (
            <p className="mb-1 font-stamp text-[11px] tracking-[0.22em] text-[var(--color-stamp)] uppercase">
              {stamp}
            </p>
          ) : null}
          <Heading level={2}>{title}</Heading>
        </div>
        {action}
      </div>

      {hasChildren ? (
        children
      ) : (
        <div className="rounded-[var(--radius-paper)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-8 text-center">
          <Text className="text-sm text-[var(--color-ink-muted)]">
            {emptyMessage}
          </Text>
        </div>
      )}
    </section>
  );
}
