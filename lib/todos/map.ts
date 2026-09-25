import { isCategorySlug } from "@/lib/category";
import type { ShoppingTodoRow, ShoppingTodoWithDisplay } from "./types";

export function mapTodoRow(
  row: ShoppingTodoRow,
  imageUrl: string | null,
): ShoppingTodoWithDisplay {
  const price =
    row.reference_price === null || row.reference_price === undefined
      ? null
      : Number(row.reference_price);

  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    imagePath: row.image,
    imageUrl,
    category:
      row.category && isCategorySlug(row.category) ? row.category : null,
    referencePrice: price !== null && Number.isFinite(price) ? price : null,
    referenceCurrency: row.reference_currency,
    referenceLocation: row.reference_location,
    note: row.note,
    status: row.status,
    purchasedItemId: row.purchased_item_id,
  };
}
