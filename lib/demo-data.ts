export type Trip = {
  id: string
  city: string
  kanji: string
  dates: string
  photo: string
  total: string
  currency: string
  items: number
  categories: number
  alt: string
}

export const trips: Trip[] = [
  {
    id: 'tokyo',
    city: 'Tokyo',
    kanji: '東京',
    dates: '2026.03.14 — 03.21',
    photo: '/photos/trip-tokyo.png',
    total: '¥48,600',
    currency: 'JPY',
    items: 14,
    categories: 5,
    alt: 'Film photograph of a Tokyo backstreet at dusk with paper lanterns and a glowing vending machine',
  },
  {
    id: 'kyoto',
    city: 'Kyoto',
    kanji: '京都',
    dates: '2025.11.08 — 11.12',
    photo: '/photos/trip-kyoto.png',
    total: '¥31,200',
    currency: 'JPY',
    items: 9,
    categories: 4,
    alt: 'Film photograph of a Kyoto wooden townhouse street in autumn with red maple leaves',
  },
  {
    id: 'seoul',
    city: 'Seoul',
    kanji: '서울',
    dates: '2025.05.02 — 05.07',
    photo: '/photos/trip-seoul.png',
    total: '₩186,000',
    currency: 'KRW',
    items: 11,
    categories: 4,
    alt: 'Film photograph of a Seoul market alley in the early morning with stacked crates and steam',
  },
  {
    id: 'osaka',
    city: 'Osaka',
    kanji: '大阪',
    dates: '2024.10.19 — 10.21',
    photo: '/photos/trip-osaka.png',
    total: '¥22,350',
    currency: 'JPY',
    items: 6,
    categories: 3,
    alt: 'Film photograph of an Osaka covered shopping arcade with warm lanterns and parked bicycles',
  },
]

export const tripById = (id: string) => trips.find((t) => t.id === id) as Trip

export type ShopRecord = {
  id: string
  name: string
  price: string
  currency: string
  place: string
  date: string
  category: string
  note: string
  image: string
  alt: string
  tripId: string
}

export const records: ShopRecord[] = [
  {
    id: 'matcha',
    name: 'Matcha tin, 30 g',
    price: '¥1,680',
    currency: 'JPY',
    place: 'Nakamise Tea Counter, Asakusa',
    date: '2026.03.15',
    category: 'Food & tea',
    note: 'Ask for the shade-grown one. Cash only.',
    image: '/products/matcha-tin.png',
    alt: 'Small green matcha tea tin on ivory paper',
    tripId: 'tokyo',
  },
  {
    id: 'cup',
    name: 'Ash-glaze tea cup',
    price: '¥3,800',
    currency: 'JPY',
    place: 'Kappabashi pottery stall',
    date: '2026.03.17',
    category: 'Tableware',
    note: 'Each one is slightly different. Wrapped in newspaper.',
    image: '/products/ceramic-cup.png',
    alt: 'Handmade speckled ceramic tea cup on ivory paper',
    tripId: 'tokyo',
  },
  {
    id: 'notebook',
    name: 'Stitched notebook',
    price: '¥1,100',
    currency: 'JPY',
    place: 'Ginza stationery counter',
    date: '2026.03.18',
    category: 'Stationery',
    note: 'Paper takes fountain-pen ink without bleeding.',
    image: '/products/notebook.png',
    alt: 'Cream stitched notebook with a fountain pen on ivory paper',
    tripId: 'tokyo',
  },
  {
    id: 'tenugui',
    name: 'Wave-pattern tenugui',
    price: '¥1,320',
    currency: 'JPY',
    place: 'Asakusa cloth shop, side street',
    date: '2026.03.16',
    category: 'Textile',
    note: 'Dries fast. Good as a wrap for the cup.',
    image: '/products/tenugui.png',
    alt: 'Folded indigo and white wave-pattern cotton towel on ivory paper',
    tripId: 'tokyo',
  },
  {
    id: 'hanji',
    name: 'Hanji paper pouch',
    price: '₩12,000',
    currency: 'KRW',
    place: 'Insadong paper shop',
    date: '2025.05.04',
    category: 'Craft',
    note: 'Lighter than it looks. Fits a passport.',
    image: '/products/hanji-pouch.png',
    alt: 'Small handmade Korean hanji paper pouch on ivory paper',
    tripId: 'seoul',
  },
  {
    id: 'sweets',
    name: 'Wagashi box, 6 pcs',
    price: '¥1,450',
    currency: 'JPY',
    place: 'Shinsaibashi arcade, back stall',
    date: '2024.10.20',
    category: 'Food & tea',
    note: 'Best eaten the same day.',
    image: '/products/sweets.png',
    alt: 'Small paper box of pastel Japanese wagashi sweets on ivory paper',
    tripId: 'osaka',
  },
]

export const recordById = (id: string) => records.find((r) => r.id === id) as ShopRecord
