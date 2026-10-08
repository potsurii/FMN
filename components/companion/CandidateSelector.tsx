"use client";

import { Button } from "@/components/foundation/Button";

export type CandidateSelectorItem = {
  id: string;
  title: string;
  meta?: string;
};

type CandidateSelectorProps = {
  /** Trip variant for L-03 「最近」; Todo variant for L-02 suspected duplicates. */
  variant: "trip" | "todo";
  title?: string;
  description?: string;
  candidates: CandidateSelectorItem[];
  disabled?: boolean;
  onSelect: (id: string) => void;
};

/**
 * Reusable candidate list. Selection executes the pending action
 * (no second Confirm). Does not write formal data by itself.
 */
export function CandidateSelector({
  variant,
  title,
  description,
  candidates,
  disabled = false,
  onSelect,
}: CandidateSelectorProps) {
  const heading =
    title ?? (variant === "trip" ? "选择旅行" : "选择购物代办");

  return (
    <div className="space-y-3 rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div>
        <p className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-stamp)] uppercase">
          Candidate
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
          {heading}
        </p>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      <ul className="space-y-2">
        {candidates.map((c) => (
          <li key={c.id}>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={disabled}
              onClick={() => onSelect(c.id)}
              className="!justify-start text-left"
            >
              <span className="flex flex-col items-start">
                <span>{c.title}</span>
                {c.meta ? (
                  <span className="text-xs font-normal text-[var(--color-ink-muted)]">
                    {c.meta}
                  </span>
                ) : null}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
