/**
 * L-02 Duplicate Detection — same Trip Shopping Todos only.
 * Exact AND match on Product + (reference_price + reference_currency)
 * + reference_location. No normalization / case-fold / fuzzy match.
 * Quantity, note, category, image, target purchase date are excluded.
 */

export type DuplicateKey = {
  tripId: string;
  name: string;
  referencePrice: number | null;
  referenceCurrency: string | null;
  referenceLocation: string | null;
};

function sameNumber(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
): boolean {
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }
  const na = typeof a === "number" ? a : Number(a);
  const nb = typeof b === "number" ? b : Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
  return na === nb;
}

export function isExactDuplicateKey(
  a: DuplicateKey,
  b: DuplicateKey,
): boolean {
  if (a.tripId !== b.tripId) return false;
  if (a.name !== b.name) return false;
  if (a.referenceCurrency !== b.referenceCurrency) return false;
  if (a.referenceLocation !== b.referenceLocation) return false;
  return sameNumber(a.referencePrice, b.referencePrice);
}

export function findSuspectedDuplicates<T extends DuplicateKey>(
  existing: readonly T[],
  candidate: DuplicateKey,
): T[] {
  return existing.filter((row) => isExactDuplicateKey(row, candidate));
}
