"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { Button } from "@/components/foundation/Button";
import { createClient } from "@/lib/supabase/client";
import { deleteItem } from "@/lib/items/mutations";

type ItemDetailActionsProps = {
  tripId: string;
  itemId: string;
  itemName: string;
};

export function ItemDetailActions({
  tripId,
  itemId,
  itemName,
}: ItemDetailActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const supabase = createClient();
      await deleteItem(supabase, itemId);
      setOpen(false);
      router.push(`/trips/${tripId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败，请重试");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={`/trips/${tripId}/items/${itemId}/edit`}>
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
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <ConfirmDialog
        open={open}
        title="删除这件商品？"
        description={<>将删除「{itemName}」。此操作无法撤销。</>}
        confirmLabel="删除"
        cancelLabel="取消"
        confirming={deleting}
        onCancel={() => {
          if (!deleting) setOpen(false);
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
