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
            <p className="mb-1 font-mono text-[0.68rem] tracking-[0.22em] text-vermilion-hi uppercase">
              {stamp}
            </p>
          ) : null}
          <Heading level={2} className="!text-paper-hi font-display">
            {title}
          </Heading>
        </div>
        {action}
      </div>

      {hasChildren ? (
        children
      ) : (
        <div className="border-2 border-dashed border-paper/25 bg-ink-2/40 px-4 py-8 text-center">
          <Text className="!text-paper/70 text-sm">{emptyMessage}</Text>
        </div>
      )}
    </section>
  );
}
