export function isPurchaseDateInTripRange(
  purchaseDate: string,
  startDate: string,
  endDate: string,
): boolean {
  if (!purchaseDate || !startDate || !endDate) return false;
  return purchaseDate >= startDate && purchaseDate <= endDate;
}

export function purchaseDateOutOfRangeMessage(
  startDate: string,
  endDate: string,
): string {
  return `购买日期必须在旅行期间内（${startDate} 至 ${endDate}）`;
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Clamp today into [startDate, endDate], or use start if today missing. */
export function defaultPurchaseDateInTripRange(
  startDate: string,
  endDate: string,
): string {
  const today = todayIso();
  if (today < startDate) return startDate;
  if (today > endDate) return endDate;
  return today;
}
