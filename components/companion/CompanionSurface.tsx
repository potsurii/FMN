"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/foundation/Button";
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
            ? "absolute inset-3 flex flex-col overflow-hidden rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[0_20px_50px_rgba(45,42,38,0.22)] md:inset-8"
            : "pointer-events-auto absolute inset-x-0 bottom-0 flex max-h-[78vh] flex-col overflow-hidden rounded-t-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[0_-12px_40px_rgba(45,42,38,0.18)] md:inset-x-auto md:right-6 md:bottom-6 md:h-[min(720px,82vh)] md:w-[420px] md:rounded-[var(--radius-paper)]"
        }
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] px-4 py-3">
          <div className="min-w-0">
            <p className="font-stamp text-[10px] tracking-[0.2em] text-[var(--color-stamp)] uppercase">
              FMN Companion
            </p>
            <h2 className="truncate text-base font-semibold text-[var(--color-ink)]">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
              上下文：{contextLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="ghost" onClick={onToggleMode}>
              {isExpanded ? "抽屉" : "全屏"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              关闭
            </Button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </section>
    </div>
  );
}
