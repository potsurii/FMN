import type { CategorySlug } from "@/lib/category";

export type TodoStatus = "active" | "converted";

export type ShoppingTodoRow = {
  id: string;
  trip_id: string;
  name: string;
  image: string | null;
  category: string | null;
  reference_price: number | string | null;
  reference_currency: string | null;
  /** Target / planned purchase location (≠ item actual purchase location). */
  reference_location: string | null;
  note: string | null;
  status: TodoStatus;
  purchased_item_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type ShoppingTodoWithDisplay = {
  id: string;
  tripId: string;
  name: string;
  imagePath: string | null;
  imageUrl: string | null;
  category: CategorySlug | null;
  referencePrice: number | null;
  referenceCurrency: string | null;
  /** Target / planned purchase location (≠ item actual purchase location). */
  referenceLocation: string | null;
  note: string | null;
  status: TodoStatus;
  purchasedItemId: string | null;
  quantity: number;
  createdAt: string;
};
