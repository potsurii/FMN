import { isCategorySlug, type CategorySlug } from "@/lib/category";

export type TodoFormValues = {
  name: string;
  category: string;
  referencePrice: string;
  referenceCurrency: string;
  referenceLocation: string;
  note: string;
};

export type TodoValidatedInput = {
  name: string;
  category: CategorySlug | null;
  referencePrice: number | null;
  referenceCurrency: string | null;
  referenceLocation: string | null;
  note: string | null;
};

export function validateTodoForm(
  values: TodoFormValues,
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

  if (priceRaw !== "") {
    const price = Number(priceRaw);
    if (!Number.isFinite(price)) {
      errors.referencePrice = "请填写有效参考价格";
    } else if (price < 0) {
      errors.referencePrice = "参考价格不能为负数";
    } else {
      referencePrice = price;
    }

    if (!values.referenceCurrency.trim()) {
      errors.referenceCurrency = "填写参考价格时必须选择货币";
    } else if (!/^[A-Za-z]{3}$/.test(values.referenceCurrency.trim())) {
      errors.referenceCurrency = "请选择有效货币";
    } else {
      referenceCurrency = values.referenceCurrency.trim().toUpperCase();
    }
  }

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
      referenceLocation: values.referenceLocation.trim()
        ? values.referenceLocation.trim()
        : null,
      note: values.note.trim() ? values.note.trim() : null,
    },
  };
}
