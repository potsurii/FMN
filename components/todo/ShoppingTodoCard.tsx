"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { Button } from "@/components/foundation/Button";
import { Text } from "@/components/foundation/Text";
import { CategoryTag } from "@/components/item/CategoryTag";
import { ItemImage } from "@/components/item/ItemImage";
import { Price } from "@/components/item/Price";
import { createClient } from "@/lib/supabase/client";
import { deleteTodo } from "@/lib/todos/mutations";
import type { ShoppingTodoWithDisplay } from "@/lib/todos/types";

type ShoppingTodoCardProps = {
  todo: ShoppingTodoWithDisplay;
  tripId: string;
};

export function ShoppingTodoCard({ todo, tripId }: ShoppingTodoCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const supabase = createClient();
      await deleteTodo(supabase, todo.id);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败，请重试");
      setDeleting(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-[var(--radius-card)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] shadow-[0_1px_0_rgba(45,42,38,0.03)]">
      <div className="flex gap-3 p-3 md:p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-paper-muted)] md:h-24 md:w-24">
          <ItemImage
            src={todo.imageUrl}
            alt={`${todo.name} todo image`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-stamp)] uppercase">
            待购买
          </p>
          <h3
            className="truncate text-base font-semibold text-[var(--color-ink)]"
            title={todo.name}
          >
            {todo.name}
          </h3>
          {todo.category ? <CategoryTag slug={todo.category} /> : null}
          {todo.referencePrice !== null && todo.referenceCurrency ? (
            <Text as="span" className="block text-sm text-[var(--color-ink-muted)]">
              参考{" "}
              <Price
                amount={todo.referencePrice}
                currency={todo.referenceCurrency}
                className="text-sm"
              />
            </Text>
          ) : null}
          {todo.referenceLocation ? (
            <Text as="span" className="block text-sm text-[var(--color-ink-muted)]">
              参考地点：{todo.referenceLocation}
            </Text>
          ) : null}
          {todo.note ? (
            <Text as="span" className="block text-sm text-[var(--color-ink-muted)]">
              {todo.note}
            </Text>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-line)] px-3 py-3 md:px-4">
        <Link href={`/trips/${tripId}/todos/${todo.id}/purchase`}>
          <Button>已购买</Button>
        </Link>
        <Link href={`/trips/${tripId}/todos/${todo.id}/edit`}>
          <Button variant="secondary">编辑</Button>
        </Link>
        <Button
          type="button"
          variant="ghost"
          className="text-[var(--color-stamp)]"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          删除
        </Button>
      </div>
      {error ? <p className="px-3 pb-3 text-sm text-red-600">{error}</p> : null}

      <ConfirmDialog
        open={open}
        title="删除这条购物代办？"
        description={<>将删除「{todo.name}」。此操作无法撤销。</>}
        confirmLabel="删除"
        cancelLabel="取消"
        confirming={deleting}
        onCancel={() => {
          if (!deleting) setOpen(false);
        }}
        onConfirm={handleConfirmDelete}
      />
    </article>
  );
}
