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
  models?: string[];
  description?: string;
  specs?: {label: string; value: string}[];
};

type DirectusProduct = Record<string, unknown>;

const DEFAULT_PRODUCTS_COLLECTION = 'products';

function formatPrice(amount: number) {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

function getString(item: DirectusProduct, fields: string[]) {
  for (const field of fields) {
    const value = item[field];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }

  return undefined;
}

function getNumber(item: DirectusProduct, fields: string[]) {
  for (const field of fields) {
    const value = item[field];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value.replace(/[^\d.-]/g, ''));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function getBoolean(item: DirectusProduct, fields: string[]) {
  for (const field of fields) {
    const value = item[field];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return undefined;
}

function getStringArray(item: DirectusProduct, fields: string[]) {
  for (const field of fields) {
    const value = item[field];
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (typeof entry === 'string') {
            return entry;
          }
          if (entry && typeof entry === 'object') {
            return getString(entry as DirectusProduct, ['name', 'title', 'model']);
          }
          return undefined;
        })
        .filter((entry): entry is string => Boolean(entry));
    }
    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return undefined;
}

function getSpecs(item: DirectusProduct) {
  const specs = item.specs || item.specifications || item.characteristics;

  if (!Array.isArray(specs)) {
    return undefined;
  }

  return specs
    .map((spec) => {
      if (!spec || typeof spec !== 'object') {
        return null;
      }

      const specRecord = spec as DirectusProduct;
      const label = getString(specRecord, ['label', 'name', 'title']);
      const value = getString(specRecord, ['value', 'text']);

      return label && value ? {label, value} : null;
    })
    .filter((spec): spec is {label: string; value: string} => Boolean(spec));
}

function getAssetUrl(asset: unknown) {
  const directusUrl = process.env.DIRECTUS_URL;

  if (!asset) {
    return undefined;
  }

  if (typeof asset === 'string') {
    if (/^https?:\/\//.test(asset)) {
      return asset;
    }
    return directusUrl ? `${directusUrl}/assets/${asset}` : asset;
  }

  if (typeof asset === 'object') {
    const assetRecord = asset as DirectusProduct;
    const directUrl = getString(assetRecord, ['url']);
    const id = getString(assetRecord, ['id']);

    if (directUrl) {
      return directUrl;
    }
    if (id && directusUrl) {
      return `${directusUrl}/assets/${id}`;
    }
  }

  return undefined;
}

function normalizeCategory(value?: string): Product['category'] | undefined {
  const category = value?.trim().toLowerCase();

  if (!category) {
    return undefined;
  }

  if (category === 'new' || category === 'новинки' || category === 'новинка') {
    return 'new';
  }

  if (
    category === 'discounted' ||
    category === 'discount' ||
    category === 'sale' ||
    category === 'скидка' ||
    category === 'скидки'
  ) {
    return 'discounted';
  }

  if (category === 'outlet' || category === 'аутлет') {
    return 'outlet';
  }

  if (category === 'unsorted' || category === 'без сортировки') {
    return 'unsorted';
  }

  return undefined;
}

function getCategory(item: DirectusProduct): Product['category'] {
  const category = normalizeCategory(getString(item, ['category', 'primary_category', 'status', 'type']));

  if (category) {
    return category;
  }

  if (getBoolean(item, ['is_outlet'])) {
    return 'outlet';
  }

  if (getBoolean(item, ['is_discounted'])) {
    return 'discounted';
  }

  if (getBoolean(item, ['is_new'])) {
    return 'new';
  }

  return 'unsorted';
}

function normalizeLocation(value?: string) {
  const location = value?.trim().toLowerCase();

  if (!location) {
    return undefined;
  }

  if (location === 'moscow' || location === 'москва' || location === 'msk') {
    return 'moscow';
  }

  if (location === 'milan' || location === 'милан' || location === 'milano') {
    return 'milan';
  }

  return undefined;
}

function normalizeProduct(item: DirectusProduct, index: number): Product {
  const price = getNumber(item, ['price', 'amount', 'total']) || 0;
  const oldPrice = getString(item, ['oldPrice', 'old_price', 'old_price_formatted']);
  const stockLocation = normalizeLocation(getString(item, ['stock_location']));
  const image =
    getAssetUrl(item.image) ||
    getAssetUrl(item.main_image) ||
    getAssetUrl(item.photo) ||
    `https://picsum.photos/seed/directus-${index}/800/800`;

  return {
    id: getString(item, ['id', 'slug', 'article', 'sku']) || String(index + 1),
    image,
    title: getString(item, ['title', 'name', 'product_name']) || 'Товар Ducati',
    desc: getString(item, ['desc', 'short_description', 'subtitle']),
    price,
    priceFormatted: getString(item, ['priceFormatted', 'price_formatted']) || formatPrice(price),
    oldPrice,
    badgeText:
      getString(item, ['badgeText', 'badge_text', 'badge']) ||
      (getBoolean(item, ['is_outlet'])
        ? 'Склад в Милане'
        : getBoolean(item, ['is_discounted'])
          ? 'Склад в России'
          : undefined),
    badgeColor: getString(item, ['badgeColor', 'badge_color']) === 'gray' ? 'gray' : 'green',
    discountBadge: getString(item, ['discountBadge', 'discount_badge', 'discount']),
    isAvailableInMoscow:
      getBoolean(item, ['isAvailableInMoscow', 'is_available_in_moscow']) ||
      stockLocation === 'moscow',
    isLastInMilan:
      getBoolean(item, ['isLastInMilan', 'is_last_in_milan']) ||
      stockLocation === 'milan',
    category: getCategory(item),
    models: getStringArray(item, ['models', 'model_names', 'ducati_models']),
    description: getString(item, ['description', 'full_description']),
    specs: getSpecs(item),
  };
}

async function getProductsFromDirectus() {
  const directusUrl = process.env.DIRECTUS_URL;
  const collection = process.env.DIRECTUS_PRODUCTS_COLLECTION || DEFAULT_PRODUCTS_COLLECTION;

  if (!directusUrl) {
    return null;
  }

  const url = new URL(`/items/${collection}`, directusUrl);
  url.searchParams.set('fields', '*.*');
  url.searchParams.set('limit', '-1');

  const res = await fetch(url, {
    headers: process.env.DIRECTUS_TOKEN
      ? {
          Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
        }
      : undefined,
    next: {revalidate: 60},
  });

  if (!res.ok) {
    return null;
  }

  const payload = (await res.json()) as {data?: DirectusProduct[]};
  if (!Array.isArray(payload.data)) {
    return null;
  }

  return payload.data.map(normalizeProduct);
}

export const fallbackProducts: Product[] = [
  {
    id: '1',
    image: 'https://picsum.photos/seed/mainprod/800/800',
    title: 'ZDU129S00SSRE5 ZARD RACING STEEL EXHAUST SLIP-ON E5 (DVL 1260)',
    price: 220477,
    priceFormatted: '220 477 ₽',
    category: 'new',
    models: ['Diavel 1260'],
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
    category: 'new',
    models: ['Monster 1200', 'Monster 821'],
  },
  {
    id: '3',
    image: 'https://picsum.photos/seed/sil2/300/300',
    title: '71160PK ARROW PAIR OF TITANIUM SILENCERS W/ LINK',
    price: 139532,
    priceFormatted: '139 532 ₽',
    category: 'new',
    models: ['Panigale V4', 'Streetfighter V4'],
  },
  {
    id: '4',
    image: 'https://picsum.photos/seed/sil3/300/300',
    title: '71162PK ARROW PAIR OF TITANIUM SILENCERS W/ LINK',
    price: 205808,
    priceFormatted: '205 808 ₽',
    category: 'new',
    models: ['Panigale V2', 'Streetfighter V2'],
  },
  {
    id: '5',
    image: 'https://picsum.photos/seed/sil4/300/300',
    title: 'ZDU129S00SSRE5-B ZARD RACING BLACK STEEL EXHAUST',
    price: 246546,
    priceFormatted: '246 546 ₽',
    category: 'new',
    models: ['Diavel 1260'],
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
    models: ['Monster 1200', 'Monster 821'],
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
    models: ['Panigale V4'],
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
    models: ['Monster 937', 'Multistrada V4', 'DesertX'],
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
    models: ['Diavel 1260'],
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
    models: ['Monster 937'],
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
    models: ['Panigale V4', 'Streetfighter V4'],
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
    models: ['Hypermotard 950'],
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
    models: ['DesertX'],
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
    models: ['Monster 937', 'Panigale V4', 'Multistrada V4'],
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
    models: ['Monster 1200', 'Monster 821', 'Monster 937'],
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
    models: ['Diavel 1260', 'Multistrada V4'],
  },
];

export const products = fallbackProducts;

export async function getProducts(): Promise<Product[]> {
  try {
    const directusProducts = await getProductsFromDirectus();
    return directusProducts && directusProducts.length > 0 ? directusProducts : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const items = await getProducts();
  return items.find((p) => p.id === id);
}

export async function getProductsByCategory(category: Product['category']): Promise<Product[]> {
  const items = await getProducts();
  return items.filter((p) => p.category === category);
}
