export type Visibility = "private" | "public";

export type ItemRecord = {
  id: string;
  trip_id: string;
  name: string;
  price: number | string;
  currency: string;
  location: string;
  purchase_date: string;
  category: string;
  image: string | null;
  note: string | null;
  visibility: Visibility;
  created_at: string;
};

export type ItemWithDisplay = {
  id: string;
  tripId: string;
  name: string;
  price: number;
  currency: string;
  location: string;
  purchaseDate: string;
  category: string;
  imagePath: string | null;
  imageUrl: string | null;
  note: string | null;
  visibility: Visibility;
};
