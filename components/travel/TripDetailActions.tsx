"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { Button } from "@/components/foundation/Button";
import { createClient } from "@/lib/supabase/client";
import { deleteTrip } from "@/lib/trips/mutations";

type TripDetailActionsProps = {
  tripId: string;
  tripName: string;
};

export function TripDetailActions({
  tripId,
  tripName,
}: TripDetailActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const supabase = createClient();
      await deleteTrip(supabase, tripId);
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败，请重试");
      setDeleting(false);
    }
  }

  return (
    <>
      <Link href={`/trips/${tripId}/edit`}>
        <Button variant="secondary">编辑旅行</Button>
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
        删除旅行
      </Button>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}

      <ConfirmDialog
        open={open}
        title="删除这次旅行？"
        description={
          <>
            将删除「{tripName}」以及该旅行下的全部购买记录。此操作无法撤销。
          </>
        }
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
