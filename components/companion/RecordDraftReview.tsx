"use client";

import { Button } from "@/components/foundation/Button";
import { Input } from "@/components/foundation/Input";
import { Textarea } from "@/components/foundation/Textarea";
import { CurrencyInput } from "@/components/form/CurrencyInput";
import { DatePicker } from "@/components/form/DatePicker";
import { FormField } from "@/components/form/FormField";
import { Select } from "@/components/form/Select";
import { CATEGORY_OPTIONS } from "@/lib/category";
import type { ShoppingRecordDraft } from "@/lib/companion/types";
import { getShoppingRecordDraftMissing } from "@/lib/workflows/record-input/text-parse";

export type TripOption = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type RecordDraftReviewProps = {
  draft: ShoppingRecordDraft;
  trips: TripOption[];
  writeError: string | null;
  writing: boolean;
  onChange: (next: ShoppingRecordDraft) => void;
  onConfirm: () => void;
  onCancel: () => void;
  /** Group review reuses the fields and keeps a single group-level Confirm. */
  showWriteActions?: boolean;
};

const CATEGORY_SELECT = [
  { value: "", label: "待补充 / 其他（可选）" },
  ...CATEGORY_OPTIONS,
];

export function RecordDraftReview({
  draft,
  trips,
  writeError,
  writing,
  onChange,
  onConfirm,
  onCancel,
  showWriteActions = true,
}: RecordDraftReviewProps) {
  const { complete, missing } = getShoppingRecordDraftMissing(draft);
  const selectedTrip = trips.find((t) => t.id === draft.tripId) ?? null;

  function patch(partial: Partial<ShoppingRecordDraft>) {
    onChange({
      ...draft,
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-4 rounded-[var(--radius-paper)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper-muted)] p-4">
      <div>
        <p className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-stamp)] uppercase">
          Draft · 待确认
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          这是草稿，不是已保存的正式购物记录。确认前可继续修改。
        </p>
      </div>

      {draft.sourceText ? (
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink-muted)]">
          <p className="mb-1 text-xs font-medium text-[var(--color-ink)]">
            原始输入
          </p>
          <p className="whitespace-pre-wrap">{draft.sourceText}</p>
        </div>
      ) : null}

      <FormField label="所属旅行" required>
        <Select
          options={[
            { value: "", label: "未指定" },
            ...trips.map((t) => ({ value: t.id, label: t.name })),
          ]}
          value={draft.tripId ?? ""}
          onChange={(e) => {
            const id = e.target.value || null;
            const trip = trips.find((t) => t.id === id) ?? null;
            patch({
              tripId: id,
              tripLabel: trip?.name ?? null,
            });
          }}
          disabled={writing}
        />
      </FormField>

      <FormField label="商品名称" required>
        <Input
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          disabled={writing}
          placeholder="必填"
        />
      </FormField>

      <FormField label="实际支付价格与货币" required>
        <CurrencyInput
          amountId="draft-amount"
          amount={draft.price === null ? "" : String(draft.price)}
          currency={draft.currency ?? "THB"}
          onAmountChange={(v) => {
            if (v.trim() === "") {
              patch({ price: null });
              return;
            }
            const n = Number(v);
            patch({ price: Number.isFinite(n) ? n : null });
          }}
          onCurrencyChange={(v) => patch({ currency: v.toUpperCase() })}
          disabled={writing}
        />
      </FormField>

      <FormField
        label="实际购买地点"
        hint="可选。未知时留空（未填写），不得猜测。"
      >
        <Input
          value={draft.location}
          onChange={(e) => patch({ location: e.target.value })}
          disabled={writing}
          placeholder="未填写"
        />
      </FormField>

      <FormField label="购买日期" required>
        <DatePicker
          value={draft.purchaseDate ?? ""}
          min={selectedTrip?.startDate}
          max={selectedTrip?.endDate}
          onChange={(e) =>
            patch({ purchaseDate: e.target.value || null })
          }
          disabled={writing}
        />
      </FormField>

      <FormField label="数量" hint="默认 1，整数且 ≥ 1">
        <Input
          type="number"
          min={1}
          step={1}
          value={String(draft.quantity)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isInteger(n) && n >= 1) patch({ quantity: n });
          }}
          disabled={writing}
        />
      </FormField>

      <FormField label="分类" hint="可选，不阻塞确认">
        <Select
          options={CATEGORY_SELECT}
          value={draft.category ?? ""}
          onChange={(e) =>
            patch({
              category: e.target.value
                ? (e.target.value as ShoppingRecordDraft["category"])
                : null,
            })
          }
          disabled={writing}
        />
      </FormField>

      <FormField label="备注" hint="可选">
        <Textarea
          value={draft.note}
          onChange={(e) => patch({ note: e.target.value })}
          disabled={writing}
        />
      </FormField>

      {!complete ? (
        <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink-muted)]">
          确认前还需补充：{missing.join("、")}
        </p>
      ) : null}

      {writeError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {writeError}
        </p>
      ) : null}

      {showWriteActions ? (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={writing}
            onClick={onCancel}
          >
            取消草稿
          </Button>
          <Button
            type="button"
            disabled={!complete || writing}
            onClick={onConfirm}
            data-fmn-confirm-write="true"
          >
            {writing ? "写入中…" : "确认写入正式记录"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
