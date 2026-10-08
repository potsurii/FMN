"use client";

import { Button } from "@/components/foundation/Button";
import type { ShoppingTodoWithDisplay } from "@/lib/todos/types";

type TodoDuplicatePromptProps = {
  existing: ShoppingTodoWithDisplay[];
  draftQuantity: number;
  busy?: boolean;
  onCreateNew: () => void;
  onUseExisting: (todo: ShoppingTodoWithDisplay) => void;
  onEditExisting: (todo: ShoppingTodoWithDisplay) => void;
  onMergeQuantity: (todo: ShoppingTodoWithDisplay) => void;
  onCancel: () => void;
};

export function TodoDuplicatePrompt({
  existing,
  draftQuantity,
  busy = false,
  onCreateNew,
  onUseExisting,
  onEditExisting,
  onMergeQuantity,
  onCancel,
}: TodoDuplicatePromptProps) {
  const primary = existing[0];

  return (
    <div className="space-y-3 rounded-[var(--radius-paper)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div>
        <p className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-stamp)] uppercase">
          Duplicate
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
          发现相似 Todo
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          同一旅行内已有商品、参考价格/货币、计划购买地点完全相同的代办。不会自动合并。
        </p>
      </div>

      {primary ? (
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-3 py-2 text-sm">
          <p className="font-medium text-[var(--color-ink)]">{primary.name}</p>
          <p className="text-[var(--color-ink-muted)]">
            {primary.referencePrice} {primary.referenceCurrency} ·{" "}
            {primary.referenceLocation} · 数量 {primary.quantity}
          </p>
        </div>
      ) : null}

      <p className="text-sm text-[var(--color-ink-muted)]">
        三个比较字段完全相同。是否把本次数量（{draftQuantity}）合并到已有代办，由你决定。
      </p>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={busy || !primary}
          onClick={() => primary && onCreateNew()}
        >
          创建新的 Todo
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !primary}
          onClick={() => primary && onUseExisting(primary)}
        >
          使用已有 Todo
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !primary}
          onClick={() => primary && onEditExisting(primary)}
        >
          修改已有 Todo
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !primary}
          onClick={() => primary && onMergeQuantity(primary)}
        >
          合并数量到已有 Todo
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  );
}
