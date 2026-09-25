export function isTripDateRangeValid(
  startDate: string,
  endDate: string,
): boolean {
  if (!startDate || !endDate) return false;
  return endDate >= startDate;
}

export type TripDatesCoverItemsResult =
  | { ok: true }
  | { ok: false; message: string; sampleDate: string; count: number };

/**
 * New trip date range must cover every existing item purchase_date.
 * Does not mutate items.
 */
export function assertTripDatesCoverItems(
  startDate: string,
  endDate: string,
  purchaseDates: string[],
): TripDatesCoverItemsResult {
  const outOfRange = purchaseDates.filter(
    (d) => d < startDate || d > endDate,
  );

  if (outOfRange.length === 0) {
    return { ok: true };
  }

  const sampleDate = [...outOfRange].sort()[0];
  const count = outOfRange.length;

  return {
    ok: false,
    count,
    sampleDate,
    message: `无法保存：有 ${count} 件商品的购买日期不在新的旅行期间内（例如 ${sampleDate}）。请先调整商品日期，或恢复更宽的旅行日期。`,
  };
}
