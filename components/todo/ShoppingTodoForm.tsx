"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/foundation/Button";
import { Input } from "@/components/foundation/Input";
import { Textarea } from "@/components/foundation/Textarea";
import { CurrencyInput } from "@/components/form/CurrencyInput";
import { FormField } from "@/components/form/FormField";
import { ImageUploader } from "@/components/form/ImageUploader";
import { Select } from "@/components/form/Select";
import { CATEGORY_OPTIONS } from "@/lib/category";
import { createClient } from "@/lib/supabase/client";
import { uploadUserImage } from "@/lib/storage/upload";
import { createTodo, updateTodo } from "@/lib/todos/mutations";
import type { ShoppingTodoWithDisplay } from "@/lib/todos/types";
import { validateTodoForm } from "@/lib/todos/validation";

type ShoppingTodoFormProps = {
  mode: "create" | "edit";
  tripId: string;
  userId: string;
  todo?: ShoppingTodoWithDisplay;
};

const CATEGORY_SELECT_OPTIONS = [
  { value: "", label: "不选择（可选）" },
  ...CATEGORY_OPTIONS,
];

export function ShoppingTodoForm({
  mode,
  tripId,
  userId,
  todo,
}: ShoppingTodoFormProps) {
  const router = useRouter();
  const cancelHref = `/trips/${tripId}`;

  const [name, setName] = useState(todo?.name ?? "");
  const [category, setCategory] = useState(todo?.category ?? "");
  const [referencePrice, setReferencePrice] = useState(
    todo?.referencePrice !== null && todo?.referencePrice !== undefined
      ? String(todo.referencePrice)
      : "",
  );
  const [referenceCurrency, setReferenceCurrency] = useState(
    todo?.referenceCurrency ?? "THB",
  );
  const [referenceLocation, setReferenceLocation] = useState(
    todo?.referenceLocation ?? "",
  );
  const [note, setNote] = useState(todo?.note ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    todo?.imageUrl ?? null,
  );
  const [existingImagePath, setExistingImagePath] = useState<string | null>(
    todo?.imagePath ?? null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function resolveImagePath(
    supabase: ReturnType<typeof createClient>,
  ): Promise<string | null> {
    if (imageFile) {
      return uploadUserImage({
        supabase,
        userId,
        bucket: "item-images",
        file: imageFile,
      });
    }
    return existingImagePath;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validated = validateTodoForm({
      name,
      category,
      referencePrice,
      referenceCurrency,
      referenceLocation,
      note,
    });

    if (!validated.ok) {
      setErrors(validated.errors);
      return;
    }
    setErrors({});

    const supabase = createClient();
    setSaving(true);
    try {
      const imagePath = await resolveImagePath(supabase);
      const payload = {
        tripId,
        name: validated.data.name,
        imagePath,
        category: validated.data.category,
        referencePrice: validated.data.referencePrice,
        referenceCurrency: validated.data.referenceCurrency,
        referenceLocation: validated.data.referenceLocation,
        note: validated.data.note,
      };

      if (mode === "edit" && todo) {
        await updateTodo(supabase, { ...payload, todoId: todo.id });
      } else {
        await createTodo(supabase, payload);
      }

      router.push(cancelHref);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "保存失败，请重试");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5">
      <FormField
        label="商品名称"
        htmlFor="todo-name"
        required
        error={errors.name}
      >
        <Input
          id="todo-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hasError={Boolean(errors.name)}
          disabled={saving}
          placeholder="例如：防晒霜"
        />
      </FormField>

      <FormField
        label="参考价格与货币"
        htmlFor="todo-amount"
        error={errors.referencePrice || errors.referenceCurrency}
        hint="可选。填写价格时必须选择货币。"
      >
        <CurrencyInput
          amountId="todo-amount"
          amount={referencePrice}
          currency={referenceCurrency}
          onAmountChange={setReferencePrice}
          onCurrencyChange={setReferenceCurrency}
          hasError={Boolean(
            errors.referencePrice || errors.referenceCurrency,
          )}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="参考购买地点"
        htmlFor="todo-location"
        hint="可选。手动输入文本，不使用地图。"
      >
        <Input
          id="todo-location"
          value={referenceLocation}
          onChange={(e) => setReferenceLocation(e.target.value)}
          disabled={saving}
          placeholder="例如：曼谷 CentralWorld"
        />
      </FormField>

      <FormField
        label="商品分类"
        htmlFor="todo-category"
        error={errors.category}
        hint="可选"
      >
        <Select
          id="todo-category"
          options={CATEGORY_SELECT_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          hasError={Boolean(errors.category)}
          disabled={saving}
        />
      </FormField>

      <FormField label="商品图片" hint="可选，最多 1 张">
        <ImageUploader
          variant="ProductImage"
          value={imageFile}
          existingUrl={existingImageUrl}
          onChange={(file) => {
            setImageFile(file);
            if (file) setExistingImageUrl(null);
          }}
          onClearExisting={() => {
            setExistingImageUrl(null);
            setExistingImagePath(null);
          }}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="备注"
        htmlFor="todo-note"
        hint="可选。例如：想买大包装、到机场再看看。"
      >
        <Textarea
          id="todo-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={saving}
          placeholder="可选"
        />
      </FormField>

      {submitError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={saving}
          onClick={() => router.push(cancelHref)}
        >
          取消
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "保存中…" : "保存"}
        </Button>
      </div>
    </form>
  );
}
