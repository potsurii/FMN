"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/foundation/Button";
import { Input } from "@/components/foundation/Input";
import { Textarea } from "@/components/foundation/Textarea";
import { CurrencyInput } from "@/components/form/CurrencyInput";
import { DatePicker } from "@/components/form/DatePicker";
import { FormField } from "@/components/form/FormField";
import { ImageUploader } from "@/components/form/ImageUploader";
import { Select } from "@/components/form/Select";
import { CATEGORY_OPTIONS, isCategorySlug } from "@/lib/category";
import { createItem, updateItem } from "@/lib/items/mutations";
import type { ItemWithDisplay, Visibility } from "@/lib/items/types";
import {
  defaultPurchaseDateInTripRange,
  isPurchaseDateInTripRange,
  purchaseDateOutOfRangeMessage,
} from "@/lib/items/validation";
import { DEFAULT_QUANTITY, parseQuantity, quantityErrorMessage } from "@/lib/quantity";
import { createClient } from "@/lib/supabase/client";
import { uploadUserImage } from "@/lib/storage/upload";
import { convertTodoToItem } from "@/lib/todos/mutations";
import type { ShoppingTodoWithDisplay } from "@/lib/todos/types";
import type { Visibility as TripVisibility } from "@/lib/trips/types";

type ItemFormProps = {
  mode: "create" | "edit" | "purchaseFromTodo";
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  tripVisibility: TripVisibility;
  userId: string;
  item?: ItemWithDisplay;
  todo?: ShoppingTodoWithDisplay;
};

const VISIBILITY_OPTIONS = [
  { value: "private", label: "私密" },
  { value: "public", label: "公开" },
];

export function ItemForm({
  mode,
  tripId,
  tripStartDate,
  tripEndDate,
  tripVisibility,
  userId,
  item,
  todo,
}: ItemFormProps) {
  const router = useRouter();
  const isFromTodo = mode === "purchaseFromTodo";

  const cancelHref =
    mode === "edit" && item
      ? `/trips/${tripId}/items/${item.id}`
      : `/trips/${tripId}`;
  const successHref =
    mode === "edit" && item
      ? `/trips/${tripId}/items/${item.id}`
      : `/trips/${tripId}`;

  const tripIsPrivate = tripVisibility === "private";

  const initialName = item?.name ?? todo?.name ?? "";
  const initialAmount = item
    ? String(item.price)
    : todo?.referencePrice !== null && todo?.referencePrice !== undefined
      ? String(todo.referencePrice)
      : "";
  const initialCurrency =
    item?.currency ?? todo?.referenceCurrency ?? "THB";
  const initialLocation =
    item?.location ?? todo?.referenceLocation ?? "";
  const initialCategory = item?.category ?? todo?.category ?? "other";
  const initialNote = item?.note ?? todo?.note ?? "";
  const initialImageUrl = item?.imageUrl ?? todo?.imageUrl ?? null;
  const initialImagePath = item?.imagePath ?? todo?.imagePath ?? null;

  const [name, setName] = useState(initialName);
  const [amount, setAmount] = useState(initialAmount);
  const [currency, setCurrency] = useState(initialCurrency);
  const [location, setLocation] = useState(initialLocation);
  const [purchaseDate, setPurchaseDate] = useState(
    item?.purchaseDate ??
      defaultPurchaseDateInTripRange(tripStartDate, tripEndDate),
  );
  const [category, setCategory] = useState(initialCategory);
  const [note, setNote] = useState(initialNote);
  const [quantity, setQuantity] = useState(
    String(item?.quantity ?? todo?.quantity ?? DEFAULT_QUANTITY),
  );
  const [visibility, setVisibility] = useState<Visibility>(
    tripIsPrivate
      ? "private"
      : isFromTodo
        ? "private"
        : (item?.visibility ?? "private"),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    initialImageUrl,
  );
  const [existingImagePath, setExistingImagePath] = useState<string | null>(
    initialImagePath,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "请填写商品名称";
    const price = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(price)) {
      next.amount = "请填写有效价格";
    } else if (price < 0) {
      next.amount = "价格不能为负数";
    }
    if (!currency) next.currency = "请选择货币";
    if (!location.trim()) next.location = "请填写购买地点";
    if (!purchaseDate) {
      next.purchaseDate = "请选择购买日期";
    } else if (
      !isPurchaseDateInTripRange(purchaseDate, tripStartDate, tripEndDate)
    ) {
      next.purchaseDate = purchaseDateOutOfRangeMessage(
        tripStartDate,
        tripEndDate,
      );
    }
    if (!isCategorySlug(category)) next.category = "请选择分类";
    const qtyMsg = quantityErrorMessage(
      quantity.trim() === "" ? DEFAULT_QUANTITY : quantity,
    );
    if (qtyMsg) next.quantity = qtyMsg;
    if (tripIsPrivate && visibility === "public") {
      next.visibility = "私密旅行中的商品只能设为私密";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

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
    if (!validate()) return;

    const supabase = createClient();
    setSaving(true);
    try {
      const imagePath = await resolveImagePath(supabase);
      const resolvedVisibility: Visibility = tripIsPrivate
        ? "private"
        : visibility;
      const payload = {
        tripId,
        name: name.trim(),
        price: Number(amount),
        currency: currency.toUpperCase(),
        location: location.trim(),
        purchaseDate,
        category,
        imagePath,
        note,
        visibility: resolvedVisibility,
        quantity:
          parseQuantity(
            quantity.trim() === "" ? DEFAULT_QUANTITY : quantity,
          ) ?? DEFAULT_QUANTITY,
      };

      if (mode === "edit" && item) {
        await updateItem(supabase, { ...payload, itemId: item.id });
      } else if (mode === "purchaseFromTodo" && todo) {
        await convertTodoToItem(supabase, {
          tripId,
          todoId: todo.id,
          item: payload,
        });
      } else {
        await createItem(supabase, payload);
      }

      router.push(successHref);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "保存失败，请重试");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5">
      {isFromTodo ? (
        <p className="rounded-[var(--radius-paper)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper-muted)] px-4 py-3 text-sm text-[var(--color-ink-muted)]">
          已从购物代办预填信息。请确认并补充实际购买价格、地点与日期。
        </p>
      ) : null}

      <FormField label="商品名称" htmlFor="item-name" required error={errors.name}>
        <Input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hasError={Boolean(errors.name)}
          disabled={saving}
        />
      </FormField>

      <FormField
        label={isFromTodo ? "实际价格与货币" : "价格与货币"}
        htmlFor="item-amount"
        required
        error={errors.amount || errors.currency}
      >
        <CurrencyInput
          amountId="item-amount"
          amount={amount}
          currency={currency}
          onAmountChange={setAmount}
          onCurrencyChange={setCurrency}
          hasError={Boolean(errors.amount || errors.currency)}
          disabled={saving}
        />
      </FormField>

      <FormField
        label={isFromTodo ? "实际购买地点" : "购买地点"}
        htmlFor="item-location"
        required
        error={errors.location}
        hint="实际购买地点。手动输入地点文本，不使用地图"
      >
        <Input
          id="item-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          hasError={Boolean(errors.location)}
          disabled={saving}
          placeholder="例如：Siam Paragon"
        />
      </FormField>

      <FormField
        label="购买日期"
        htmlFor="item-date"
        required
        error={errors.purchaseDate}
        hint={`须在旅行期间内：${tripStartDate} 至 ${tripEndDate}`}
      >
        <DatePicker
          id="item-date"
          value={purchaseDate}
          min={tripStartDate}
          max={tripEndDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          hasError={Boolean(errors.purchaseDate)}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="数量"
        htmlFor="item-quantity"
        error={errors.quantity}
        hint="商品数量，默认 1。与购物记录条数不是同一概念。"
      >
        <Input
          id="item-quantity"
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          hasError={Boolean(errors.quantity)}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="商品分类"
        htmlFor="item-category"
        required
        error={errors.category}
      >
        <Select
          id="item-category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          hasError={Boolean(errors.category)}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="公开 / 私密"
        htmlFor="item-visibility"
        required
        error={errors.visibility}
        hint={
          tripIsPrivate
            ? "所属旅行为私密，商品只能设为私密"
            : isFromTodo
              ? "从购物代办转换的商品默认私密，可按需修改"
              : undefined
        }
      >
        <Select
          id="item-visibility"
          options={
            tripIsPrivate
              ? [{ value: "private", label: "私密" }]
              : VISIBILITY_OPTIONS
          }
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
          hasError={Boolean(errors.visibility)}
          disabled={saving || tripIsPrivate}
        />
      </FormField>

      <FormField
        label={isFromTodo ? "实际商品图片" : "商品图片"}
        hint="可选，最多 1 张"
      >
        <ImageUploader
          variant="ProductImage"
          value={imageFile}
          existingUrl={existingImageUrl}
          onChange={(file) => {
            setImageFile(file);
            if (file) {
              setExistingImageUrl(null);
            }
          }}
          onClearExisting={() => {
            setExistingImageUrl(null);
            setExistingImagePath(null);
          }}
          disabled={saving}
        />
      </FormField>

      <FormField label="备注" htmlFor="item-note">
        <Textarea
          id="item-note"
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
          {saving
            ? "保存中…"
            : isFromTodo
              ? "确认已购买"
              : "保存"}
        </Button>
      </div>
    </form>
  );
}
