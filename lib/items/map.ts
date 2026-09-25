import type { ItemRecord, ItemWithDisplay } from "./types";

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapItemRecord(
  row: ItemRecord,
  imageUrl: string | null = null,
): ItemWithDisplay {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    price: toNumber(row.price),
    currency: row.currency.trim().toUpperCase(),
    location: row.location,
    purchaseDate: row.purchase_date,
    category: row.category,
    imagePath: row.image,
    imageUrl,
    note: row.note,
    visibility: row.visibility,
  };
}
