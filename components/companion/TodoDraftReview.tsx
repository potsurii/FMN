"use client";

import { Button } from "@/components/foundation/Button";
import { Input } from "@/components/foundation/Input";
import { Textarea } from "@/components/foundation/Textarea";
import { CurrencyInput } from "@/components/form/CurrencyInput";
import { FormField } from "@/components/form/FormField";
import { Select } from "@/components/form/Select";
import { CATEGORY_OPTIONS } from "@/lib/category";
import type { ShoppingTodoDraft } from "@/lib/companion/types";
import { getShoppingTodoDraftMissing } from "@/lib/workflows/todo-planning/text-parse";
import type { TripOption } from "@/components/companion/RecordDraftReview";

type TodoDraftReviewProps = {
  draft: ShoppingTodoDraft;
  trips: TripOption[];
  writeError: string | null;
  writing: boolean;
  onChange: (next: ShoppingTodoDraft) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const CATEGORY_SELECT = [
  { value: "", label: "待补充 / 其他（可选）" },
  ...CATEGORY_OPTIONS,
];

/**
 * F3-04 Todo Draft review + explicit Confirm.
 * Confirm disabled until New Todo required fields are complete.
 */
export function TodoDraftReview({
  draft,
  trips,
  writeError,
  writing,
  onChange,
  onConfirm,
  onCancel,
}: TodoDraftReviewProps) {
  const { complete, missing } = getShoppingTodoDraftMissing(draft);

  function patch(partial: Partial<ShoppingTodoDraft>) {
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
          Todo Draft · 待确认
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          这是购物代办草稿，不是已保存的正式 Todo。确认前可继续修改。
          计划购买地点（reference_location）≠ 实际购买地点。
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

      <FormField
        label="参考价格与货币"
        required
        hint="必须是具体参考价格，不能是预算 / 范围 / 约数"
      >
        <CurrencyInput
          amountId="todo-draft-amount"
          amount={
            draft.referencePrice === null ? "" : String(draft.referencePrice)
          }
          currency={draft.referenceCurrency ?? "JPY"}
          onAmountChange={(v) => {
            if (v.trim() === "") {
              patch({ referencePrice: null });
              return;
            }
            const n = Number(v);
            patch({ referencePrice: Number.isFinite(n) ? n : null });
          }}
          onCurrencyChange={(v) =>
            patch({ referenceCurrency: v.toUpperCase() })
          }
          disabled={writing}
        />
      </FormField>

      <FormField
        label="计划购买地点"
        required
        hint="Target Purchase Location（计划购买地点）"
      >
        <Input
          value={draft.referenceLocation}
          onChange={(e) => patch({ referenceLocation: e.target.value })}
          disabled={writing}
          placeholder="必填，例如：松本清"
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
                ? (e.target.value as ShoppingTodoDraft["category"])
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
          data-fmn-confirm-todo-write="true"
        >
          {writing ? "写入中…" : "确认写入正式代办"}
        </Button>
      </div>
    </div>
  );
}
