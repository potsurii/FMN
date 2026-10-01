/** Shared Quantity helpers — commodity count, not Shopping Record count. */

export const DEFAULT_QUANTITY = 1;

export function parseQuantity(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 1) return null;
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^\d+$/.test(trimmed)) return null;
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 1) return null;
    return n;
  }
  return null;
}

export function normalizeQuantity(
  value: unknown,
  fallback: number = DEFAULT_QUANTITY,
): number {
  return parseQuantity(value) ?? fallback;
}

export function quantityErrorMessage(value: unknown): string | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  if (parseQuantity(value) === null) {
    return "数量必须为大于等于 1 的整数";
  }
  return null;
}
