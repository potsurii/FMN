export type Visibility = "private" | "public";
export type TravelStatus = "upcoming" | "active" | "ended";

export type TripRow = {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  main_image: string | null;
  visibility: Visibility;
  travel_status: TravelStatus;
  created_at: string;
};

export type ItemRow = {
  id: string;
  trip_id: string;
  name: string;
  price: number | string;
  currency: string;
  category: string;
  visibility?: Visibility;
};

export type CurrencySpend = {
  currency: string;
  total: number;
};

export type TripWithStats = {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  mainImagePath: string | null;
  mainImageUrl: string | null;
  visibility: Visibility;
  travelStatus: TravelStatus;
  itemCount: number;
  categoryCount: number;
  spendByCurrency: CurrencySpend[];
};
