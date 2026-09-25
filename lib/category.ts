export type CategorySlug =
  | "beauty"
  | "food"
  | "fashion"
  | "jewelry"
  | "daily"
  | "electronics"
  | "other";

const CATEGORY_LABELS: Record<CategorySlug, string> = {
  beauty: "美妆",
  food: "食品",
  fashion: "服饰",
  jewelry: "饰品",
  daily: "日用品",
  electronics: "电子产品",
  other: "其他",
};

export const CATEGORY_OPTIONS: { value: CategorySlug; label: string }[] =
  (
    Object.entries(CATEGORY_LABELS) as [CategorySlug, string][]
  ).map(([value, label]) => ({ value, label }));

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORY_LABELS;
}

export function getCategoryLabel(slug: string): string {
  if (isCategorySlug(slug)) {
    return CATEGORY_LABELS[slug];
  }
  return slug;
}
