"use client";

import type { ReactNode } from "react";
import { FmnButton } from "@/components/ui/fmn-button";
import type { CompanionSurfaceMode } from "@/lib/companion/types";

type CompanionSurfaceProps = {
  open: boolean;
  mode: CompanionSurfaceMode;
  title: string;
  contextLabel: string;
  onClose: () => void;
  onToggleMode: () => void;
  children: ReactNode;
};

export function CompanionSurface({
  open,
  mode,
  title,
  contextLabel,
  onClose,
  onToggleMode,
  children,
}: CompanionSurfaceProps) {
  if (!open) return null;

  const isExpanded = mode === "expanded";

  return (
    <div
      className={`fixed inset-0 z-50 ${isExpanded ? "" : "pointer-events-none"}`}
      role="presentation"
    >
      {isExpanded ? (
        <button
          type="button"
          aria-label="关闭 Companion 背景"
          className="absolute inset-0 bg-[rgba(45,42,38,0.35)]"
          onClick={onClose}
        />
      ) : null}

      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          isExpanded
            ? "paper-hi font-mono absolute inset-3 flex flex-col overflow-hidden border-2 border-dashed border-ink/50 text-ink shadow-paper md:inset-8"
            : "paper-hi font-mono pointer-events-auto absolute inset-x-0 bottom-0 flex max-h-[78vh] flex-col overflow-hidden border-2 border-dashed border-ink/50 text-ink shadow-paper md:inset-x-auto md:right-6 md:bottom-6 md:h-[min(720px,82vh)] md:w-[420px]"
        }
      >
        <header className="flex items-start justify-between gap-3 border-b border-dashed border-ink/30 px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[0.62rem] tracking-[0.22em] text-vermilion uppercase">
              FMN Companion
            </p>
            <h2 className="truncate font-mono text-base font-medium tracking-[0.08em] text-ink">
              {title}
            </h2>
            <p className="mt-0.5 font-mono text-[0.68rem] tracking-wide text-ink/60">
              上下文：{contextLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <FmnButton type="button" variant="ticket" onClick={onToggleMode}>
              {isExpanded ? "DRAWER" : "EXPAND"}
            </FmnButton>
            <FmnButton type="button" variant="ticket" onClick={onClose}>
              CLOSE
            </FmnButton>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </section>
    </div>
  );
}
