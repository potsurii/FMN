import { isCategorySlug, type CategorySlug } from "@/lib/category";
import {
  DEFAULT_QUANTITY,
  parseQuantity,
  quantityErrorMessage,
} from "@/lib/quantity";

export type TodoFormValues = {
  name: string;
  category: string;
  referencePrice: string;
  referenceCurrency: string;
  referenceLocation: string;
  note: string;
  quantity: string;
};

export type TodoValidatedInput = {
  name: string;
  category: CategorySlug | null;
  referencePrice: number | null;
  referenceCurrency: string | null;
  referenceLocation: string | null;
  note: string | null;
  quantity: number;
};

export type ValidateTodoFormOptions = {
  /**
   * Phase 3 New Todo create: require reference_price/currency/location.
   * Legacy edit (or unknown boundary): do not force-fill incomplete history.
   */
  requireReferenceFields: boolean;
};

export function validateTodoForm(
  values: TodoFormValues,
  options: ValidateTodoFormOptions = { requireReferenceFields: false },
): { ok: true; data: TodoValidatedInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = values.name.trim();
  if (!name) {
    errors.name = "请填写商品名称";
  }

  let category: CategorySlug | null = null;
  if (values.category.trim()) {
    if (!isCategorySlug(values.category)) {
      errors.category = "请选择有效分类";
    } else {
      category = values.category;
    }
  }

  const priceRaw = values.referencePrice.trim();
  let referencePrice: number | null = null;
  let referenceCurrency: string | null = null;
  const currencyRaw = values.referenceCurrency.trim();
  const locationRaw = values.referenceLocation.trim();

  if (options.requireReferenceFields) {
    if (priceRaw === "") {
      errors.referencePrice = "请填写参考价格";
    } else {
      const price = Number(priceRaw);
      if (!Number.isFinite(price)) {
        errors.referencePrice = "请填写有效参考价格";
      } else if (price < 0) {
        errors.referencePrice = "参考价格不能为负数";
      } else {
        referencePrice = price;
      }
    }

    if (!currencyRaw) {
      errors.referenceCurrency = "请选择参考货币";
    } else if (!/^[A-Za-z]{3}$/.test(currencyRaw)) {
      errors.referenceCurrency = "请选择有效货币";
    } else {
      referenceCurrency = currencyRaw.toUpperCase();
    }

    if (!locationRaw) {
      errors.referenceLocation = "请填写计划购买地点";
    }
  } else if (priceRaw !== "") {
    const price = Number(priceRaw);
    if (!Number.isFinite(price)) {
      errors.referencePrice = "请填写有效参考价格";
    } else if (price < 0) {
      errors.referencePrice = "参考价格不能为负数";
    } else {
      referencePrice = price;
    }

    if (!currencyRaw) {
      errors.referenceCurrency = "填写参考价格时必须选择货币";
    } else if (!/^[A-Za-z]{3}$/.test(currencyRaw)) {
      errors.referenceCurrency = "请选择有效货币";
    } else {
      referenceCurrency = currencyRaw.toUpperCase();
    }
  }

  const qtyErr = quantityErrorMessage(
    values.quantity.trim() === "" ? DEFAULT_QUANTITY : values.quantity,
  );
  if (qtyErr) {
    errors.quantity = qtyErr;
  }
  const quantity =
    parseQuantity(
      values.quantity.trim() === "" ? DEFAULT_QUANTITY : values.quantity,
    ) ?? DEFAULT_QUANTITY;

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      category,
      referencePrice,
      referenceCurrency,
      referenceLocation: locationRaw ? locationRaw : null,
      note: values.note.trim() ? values.note.trim() : null,
      quantity,
    },
  };
}
