"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { Tape } from "@/components/fmn/paper";
import { ItemImage } from "@/components/item/ItemImage";
import { FmnButton } from "@/components/ui/fmn-button";
import { FmnPaperCard } from "@/components/ui/fmn-paper-card";
import { FmnTag } from "@/components/ui/fmn-tag";
import { getCategoryLabel } from "@/lib/category";
import { formatMoney } from "@/lib/currency";
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
    <FmnPaperCard dashed className="overflow-hidden">
      <div className="flex gap-3 p-3 md:p-4">
        <figure className="paper-hi shadow-paper relative h-24 w-20 shrink-0 p-1.5 pb-2 md:h-28 md:w-24">
          <Tape className="-top-2 left-1/2 w-10 -translate-x-1/2 -rotate-2" />
          <ItemImage
            src={todo.imageUrl}
            alt={`${todo.name} todo image`}
            className="h-full w-full object-cover"
          />
        </figure>
        <div className="min-w-0 flex-1 space-y-1.5">
          <FmnTag>待购买</FmnTag>
          <h3
            className="font-display truncate text-lg leading-tight font-bold text-ink"
            title={todo.name}
          >
            {todo.name}
          </h3>
          {todo.category ? <FmnTag>{getCategoryLabel(todo.category)}</FmnTag> : null}
          {todo.referencePrice !== null && todo.referenceCurrency ? (
            <p className="font-mono text-[0.72rem] text-ink/75">
              参考{" "}
              {formatMoney(todo.referencePrice, todo.referenceCurrency)}
              <span className="ml-1 tracking-[0.12em] uppercase">
                {todo.referenceCurrency}
              </span>
            </p>
          ) : null}
          {todo.referenceLocation ? (
            <p className="font-mono text-[0.72rem] text-ink/70">
              参考地点：{todo.referenceLocation}
            </p>
          ) : null}
          {todo.note ? (
            <p className="font-mono text-[0.72rem] text-ink/60">{todo.note}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-dashed border-ink/30 px-3 py-3 md:px-4">
        <Link href={`/trips/${tripId}/todos/${todo.id}/purchase`}>
          <FmnButton variant="stamp">已购买</FmnButton>
        </Link>
        <Link href={`/trips/${tripId}/todos/${todo.id}/edit`}>
          <FmnButton variant="ticket">编辑</FmnButton>
        </Link>
        <FmnButton
          type="button"
          variant="ticket"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          删除
        </FmnButton>
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
    </FmnPaperCard>
  );
}
