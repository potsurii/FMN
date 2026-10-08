"use client";

import { useState } from "react";
import { Button } from "@/components/foundation/Button";
import { Input } from "@/components/foundation/Input";
import { DatePicker } from "@/components/form/DatePicker";
import { FormField } from "@/components/form/FormField";
import { ImageUploader } from "@/components/form/ImageUploader";
import {
  RecordDraftReview,
  type TripOption,
} from "@/components/companion/RecordDraftReview";
import type { ReceiptDraftGroup } from "@/lib/companion/types";
import { getReceiptDraftGroupConfirmState } from "@/lib/workflows/record-input/receipt-draft-group";

type ReceiptDraftGroupReviewProps = {
  group: ReceiptDraftGroup;
  trips: TripOption[];
  writeError: string | null;
  writing: boolean;
  uploadingImage: boolean;
  onChange: (next: ReceiptDraftGroup) => void;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onImageFile: (file: File | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ReceiptDraftGroupReview({
  group,
  trips,
  writeError,
  writing,
  uploadingImage,
  onChange,
  onAddItem,
  onDeleteItem,
  onImageFile,
  onConfirm,
  onCancel,
}: ReceiptDraftGroupReviewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    group.items[0]?.id ?? null,
  );
  const selected =
    group.items.find((item) => item.id === selectedId) ??
    group.items[0] ??
    null;
  const confirmState = getReceiptDraftGroupConfirmState(group);

  function patchGroup(partial: Partial<ReceiptDraftGroup>) {
    onChange({
      ...group,
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-4 rounded-[var(--radius-paper)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper-muted)] p-4">
      <div>
        <p className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-stamp)] uppercase">
          Receipt Draft · 待确认
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          这是收据草稿组，不是已保存的正式记录。删除一条商品不会删除收据或其他商品。
        </p>
      </div>

      <FormField label="收据日期">
        <DatePicker
          value={group.receiptDate ?? ""}
          onChange={(e) =>
            patchGroup({
              receiptDate: e.target.value ? e.target.value : null,
            })
          }
        />
      </FormField>

      <FormField
        label="商家 / 店铺"
        hint="仅草稿信息，不会写入收据表。"
      >
        <Input
          value={group.merchant}
          onChange={(e) => patchGroup({ merchant: e.target.value })}
        />
      </FormField>

      <ImageUploader
        variant="ProductImage"
        value={null}
        disabled={writing || uploadingImage}
        onChange={(file) => onImageFile(file)}
      />
      {group.receiptImageRef ? (
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-[var(--color-ink-muted)]">
            临时收据：{group.receiptImageRef}
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={writing || uploadingImage}
            onClick={() => onImageFile(null)}
          >
            移除收据图片
          </Button>
        </div>
      ) : null}
      {uploadingImage ? (
        <p className="text-xs text-[var(--color-ink-muted)]">正在上传临时收据…</p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          商品草稿（{group.items.length}）
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={writing}
          onClick={onAddItem}
        >
          新增商品草稿
        </Button>
      </div>

      {group.items.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          还没有商品草稿。可以手动新增，确认前不会写入正式记录。
        </p>
      ) : (
        <ul className="space-y-2">
          {group.items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-sm text-[var(--color-ink)]"
                onClick={() => setSelectedId(item.id)}
              >
                {index + 1}. {item.name.trim() || "未命名"}
              </button>
              <Button
                type="button"
                variant="secondary"
                disabled={writing}
                onClick={() => onDeleteItem(item.id)}
              >
                删除
              </Button>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <RecordDraftReview
          draft={selected}
          trips={trips}
          writeError={null}
          writing={writing}
          showWriteActions={false}
          onChange={(next) =>
            onChange({
              ...group,
              updatedAt: new Date().toISOString(),
              items: group.items.map((item) =>
                item.id === selected.id
                  ? { ...next, id: selected.id, receiptImageRef: null }
                  : item,
              ),
            })
          }
          onConfirm={() => undefined}
          onCancel={() => undefined}
        />
      ) : null}

      {!confirmState.ready ? (
        <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink-muted)]">
          确认前还需：{confirmState.reasons.join("；")}
        </p>
      ) : null}

      {writeError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {writeError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={writing}
          onClick={onCancel}
        >
          取消收据草稿
        </Button>
        <Button
          type="button"
          disabled={!confirmState.ready || writing || uploadingImage}
          onClick={onConfirm}
          data-fmn-confirm-write="true"
        >
          {writing ? "写入中…" : "确认写入正式记录"}
        </Button>
      </div>
    </div>
  );
}
