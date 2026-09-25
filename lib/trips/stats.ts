import type { CurrencySpend, ItemRow, TripRow, TripWithStats } from "./types";

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Aggregate item stats per trip.
 * Multi-currency totals are kept separate — never summed across currencies.
 */
export function buildTripStats(
  trips: TripRow[],
  items: ItemRow[],
  imageUrls: Map<string, string | null> = new Map(),
): TripWithStats[] {
  const itemsByTrip = new Map<string, ItemRow[]>();

  for (const item of items) {
    const list = itemsByTrip.get(item.trip_id) ?? [];
    list.push(item);
    itemsByTrip.set(item.trip_id, list);
  }

  return trips.map((trip) => {
    const tripItems = itemsByTrip.get(trip.id) ?? [];
    const categories = new Set<string>();
    const spendMap = new Map<string, number>();

    for (const item of tripItems) {
      categories.add(item.category);
      const currency = item.currency.trim().toUpperCase();
      const prev = spendMap.get(currency) ?? 0;
      spendMap.set(currency, prev + toNumber(item.price));
    }

    const spendByCurrency: CurrencySpend[] = Array.from(spendMap.entries())
      .map(([currency, total]) => ({ currency, total }))
      .sort((a, b) => a.currency.localeCompare(b.currency));

    return {
      id: trip.id,
      userId: trip.user_id,
      name: trip.name,
      startDate: trip.start_date,
      endDate: trip.end_date,
      mainImagePath: trip.main_image,
      mainImageUrl: imageUrls.get(trip.id) ?? null,
      visibility: trip.visibility,
      travelStatus: trip.travel_status,
      itemCount: tripItems.length,
      categoryCount: categories.size,
      spendByCurrency,
    };
  });
}
