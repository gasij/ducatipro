export type Product = {
  id: string;
  image: string;
  title: string;
  desc?: string;
  price: number;
  priceFormatted: string;
  oldPrice?: string;
  badgeText?: string;
  badgeColor?: 'green' | 'gray';
  discountBadge?: string;
  isAvailableInMoscow?: boolean;
  isLastInMilan?: boolean;
  category: 'new' | 'discounted' | 'outlet' | 'unsorted';
  description?: string;
  specs?: {label: string; value: string}[];
};

export const products: Product[] = [
  {
    id: '1',
    image: 'https://picsum.photos/seed/mainprod/800/800',
    title: 'ZDU129S00SSRE5 ZARD RACING STEEL EXHAUST SLIP-ON E5 (DVL 1260)',
    price: 220477,
    priceFormatted: '220 477 ₽',
    badgeText: 'Предзаказ',
    category: 'new',
    description:
      "DVL 1260 /S '21-22 (EURO 5). The Zard exhaust Racing for Ducati Diavel 1260 E5 2021-2022 with steel slip-on and steel end cap, is a masterpiece of Italian craftsmanship and engineering.",
    specs: [
      {label: 'Брэнд', value: 'ZARD'},
      {label: 'Товарная группа', value: 'Двигатель/ Трансмиссия/ Выхлопная'},
      {label: 'Материал', value: 'Steel'},
      {label: 'Экономия веса', value: '-5.8 kg'},
    ],
  },
  {
    id: '2',
    image: 'https://picsum.photos/seed/sil1/300/300',
    title: 'ZDU005SI0TTR ZARD PAIR OF COMPENSED TITANIUM SILENCERS',
    price: 231435,
    priceFormatted: '231 435 ₽',
    badgeText: 'Предзаказ',
    category: 'new',
  },
  {
    id: '3',
    image: 'https://picsum.photos/seed/sil2/300/300',
    title: '71160PK ARROW PAIR OF TITANIUM SILENCERS W/ LINK',
    price: 139532,
    priceFormatted: '139 532 ₽',
    badgeText: 'Предзаказ',
    category: 'new',
  },
  {
    id: '4',
    image: 'https://picsum.photos/seed/sil3/300/300',
    title: '71162PK ARROW PAIR OF TITANIUM SILENCERS W/ LINK',
    price: 205808,
    priceFormatted: '205 808 ₽',
    badgeText: 'Предзаказ',
    category: 'new',
  },
  {
    id: '5',
    image: 'https://picsum.photos/seed/sil4/300/300',
    title: 'ZDU129S00SSRE5-B ZARD RACING BLACK STEEL EXHAUST',
    price: 246546,
    priceFormatted: '246 546 ₽',
    badgeText: 'Предзаказ',
    category: 'new',
  },
  {
    id: '6',
    image: 'https://picsum.photos/seed/seat/300/300',
    title: '96880382AB DUCATI COMFORT LOWERED SEAT (M 1200, M 821)',
    price: 27756,
    priceFormatted: '27 756 ₽',
    oldPrice: '30 840 ₽',
    badgeText: 'Склад в России',
    badgeColor: 'gray',
    discountBadge: '-10%',
    isAvailableInMoscow: true,
    category: 'discounted',
  },
  {
    id: '7',
    image: 'https://picsum.photos/seed/guard/300/300',
    title: 'AE68151 AELLA FRAME PROTECTION (P V4 SP2)',
    price: 19176,
    priceFormatted: '19 176 ₽',
    oldPrice: '27 394 ₽',
    badgeText: 'Склад в России',
    badgeColor: 'gray',
    discountBadge: '-30%',
    isAvailableInMoscow: true,
    category: 'discounted',
  },
  {
    id: '8',
    image: 'https://picsum.photos/seed/chain/300/300',
    title: 'DID525VX 130L DRIVE CHAIN',
    desc: 'Цепь с замком 130 звеньев',
    price: 7290,
    priceFormatted: '7 290 ₽',
    oldPrice: '9 720 ₽',
    badgeText: 'Склад в России',
    badgeColor: 'gray',
    discountBadge: '-25%',
    category: 'discounted',
  },
  {
    id: '9',
    image: 'https://picsum.photos/seed/cover/300/300',
    title: '97381111AA ALUMINIUM CLUTCH COVER',
    desc: 'DIAVEL 1260 /S',
    price: 15177,
    priceFormatted: '15 177 ₽',
    oldPrice: '20 236 ₽',
    badgeText: 'Склад в России',
    badgeColor: 'gray',
    discountBadge: '-25%',
    category: 'discounted',
  },
  {
    id: '10',
    image: 'https://picsum.photos/seed/out1/300/300',
    title: '97181011AB DUCATI MONSTER GP COVER SET (BLK) (M 937)',
    price: 42350,
    priceFormatted: '42 350 ₽',
    oldPrice: '56 467 ₽',
    badgeText: 'Склад в Милане',
    badgeColor: 'gray',
    discountBadge: '-25%',
    desc: 'В наличии на складе в Милане. Цена указана до двери...',
    category: 'outlet',
  },
  {
    id: '11',
    image: 'https://picsum.photos/seed/out2/300/300',
    title: 'D17009400ITC TERMIGNONI TITANIUM/STEEL COMP. EXHAUST',
    price: 317682,
    priceFormatted: '317 682 ₽',
    badgeText: 'Склад в Милане',
    badgeColor: 'gray',
    isLastInMilan: true,
    category: 'outlet',
  },
  {
    id: '12',
    image: 'https://picsum.photos/seed/out3/300/300',
    title: '96481563A TERMIGNONI PAIR OF TITANIUM SILENCERS (HM 950)',
    price: 164275,
    priceFormatted: '164 275 ₽',
    oldPrice: '182 479 ₽',
    badgeText: 'Склад в Милане',
    badgeColor: 'gray',
    discountBadge: '-10%',
    isLastInMilan: true,
    category: 'outlet',
  },
  {
    id: '13',
    image: 'https://picsum.photos/seed/out4/300/300',
    title: '96482052AA TERMIGNONI TITANIUM RACING EXHAUST (DSRT X)',
    price: 248755,
    priceFormatted: '248 755 ₽',
    badgeText: 'Склад в Милане',
    badgeColor: 'gray',
    isLastInMilan: true,
    category: 'outlet',
  },
  {
    id: '14',
    image: 'https://picsum.photos/seed/misc1/300/300',
    title: '4601A711A DUCATI OIL FILTER KIT',
    price: 4890,
    priceFormatted: '4 890 ₽',
    badgeText: 'Без сортировки',
    badgeColor: 'gray',
    category: 'unsorted',
  },
  {
    id: '15',
    image: 'https://picsum.photos/seed/misc2/300/300',
    title: '42610491A DUCATI BRAKE PAD SET FRONT',
    price: 11200,
    priceFormatted: '11 200 ₽',
    badgeText: 'Без сортировки',
    badgeColor: 'gray',
    category: 'unsorted',
  },
  {
    id: '16',
    image: 'https://picsum.photos/seed/misc3/300/300',
    title: '520M0591 DUCATI REAR SPROCKET 42T',
    price: 8750,
    priceFormatted: '8 750 ₽',
    badgeText: 'Без сортировки',
    badgeColor: 'gray',
    category: 'unsorted',
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: Product['category']): Product[] {
  return products.filter((p) => p.category === category);
}
