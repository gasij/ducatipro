import {
  convertPriceToRub,
  formatPriceInRub,
  formatPriceStringInRub,
  parsePriceAmount,
} from '@/src/fsd/shared/lib/money';

export type Product = {
  id: string;
  sku?: string;
  slug?: string;
  image: string;
  title: string;
  desc?: string;
  price: number;
  priceFormatted: string;
  weight?: number;
  oldPrice?: string;
  badgeText?: string;
  badgeColor?: 'green' | 'gray';
  discountBadge?: string;
  isNew?: boolean;
  isDiscounted?: boolean;
  isOutlet?: boolean;
  isAvailableInMoscow?: boolean;
  isLastInMilan?: boolean;
  category: 'new' | 'discounted' | 'outlet' | 'unsorted';
  models?: string[];
  description?: string;
  specs?: {label: string; value: string}[];
};

type DirectusProduct = Record<string, unknown>;

export type ProductsPageResult = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const DEFAULT_PRODUCTS_COLLECTION = 'products';
const DEFAULT_PRODUCT_MOTORCYCLES_COLLECTION = 'motorcycles_products';
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PRODUCT_IMAGE = '/product-placeholder.svg';

function getString(item: DirectusProduct, fields: string[]): string | undefined {
  for (const field of fields) {
    const value = item[field];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = getString(value as DirectusProduct, ['name', 'title', 'slug', 'model', 'category']);
      if (nested) {
        return nested;
      }
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

function getMotorcycleLabel(item: DirectusProduct) {
  const name = getString(item, ['name', 'title', 'model']);
  const year = getString(item, ['year']);

  if (!name) {
    return undefined;
  }

  if (year && !name.includes(year)) {
    return `${name} ${year}`;
  }

  return name;
}

function getStringArray(item: DirectusProduct, fields: string[]) {
  const extractEntry = (entry: unknown) => {
    if (typeof entry === 'string') {
      return entry;
    }

    if (entry && typeof entry === 'object') {
      const entryRecord = entry as DirectusProduct;
      return (
        getMotorcycleLabel(entryRecord) ||
        getMotorcycleLabel(entryRecord.motorcycles_id as DirectusProduct) ||
        getMotorcycleLabel(entryRecord.motorcycle_id as DirectusProduct) ||
        getMotorcycleLabel(entryRecord.motorcycles as DirectusProduct) ||
        getMotorcycleLabel(entryRecord.motorcycle as DirectusProduct)
      );
    }

    return undefined;
  };

  for (const field of fields) {
    const value = item[field];

    if (Array.isArray(value)) {
      const entries = value
        .map(extractEntry)
        .filter((entry): entry is string => Boolean(entry));
      return [...new Set(entries)];
    }

    if (value && typeof value === 'object') {
      const relation = value as DirectusProduct;
      const nestedData = relation.data;

      if (Array.isArray(nestedData)) {
        const entries = nestedData
          .map(extractEntry)
          .filter((entry): entry is string => Boolean(entry));
        return [...new Set(entries)];
      }

      const entry = extractEntry(value);
      if (entry) {
        return [entry];
      }
    }

    if (typeof value === 'string' && value.trim()) {
      const entries = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      return [...new Set(entries)];
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

function getCategory(
  item: DirectusProduct,
  flags?: {isNew?: boolean; isDiscounted?: boolean; isOutlet?: boolean},
): Product['category'] {
  const category = normalizeCategory(getString(item, ['category', 'primary_category', 'status', 'type']));

  if (category) {
    return category;
  }

  if (flags?.isNew) {
    return 'new';
  }

  if (flags?.isDiscounted) {
    return 'discounted';
  }

  if (flags?.isOutlet) {
    return 'outlet';
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
  const rawPrice = getNumber(item, ['price', 'amount', 'total']) || 0;
  const price = convertPriceToRub(rawPrice);
  const oldPrice = getString(item, ['oldPrice', 'old_price', 'old_price_formatted']);
  const sku = getString(item, ['sku', 'article', 'vendor_code']);
  const slug = getString(item, ['slug']);
  const stockLocation = normalizeLocation(getString(item, ['stock_location']));
  const isNew = getBoolean(item, ['isNew', 'is_new']);
  const isDiscounted = getBoolean(item, ['isDiscounted', 'is_discounted']);
  const isOutlet = getBoolean(item, ['isOutlet', 'is_outlet']);
  const image =
    getAssetUrl(item.image) ||
    getAssetUrl(item.main_image) ||
    getAssetUrl(item.photo) ||
    DEFAULT_PRODUCT_IMAGE;

  return {
    id: getString(item, ['id', 'slug', 'article', 'sku']) || String(index + 1),
    sku,
    slug,
    image,
    title: getString(item, ['title', 'name', 'product_name']) || 'Товар Ducati',
    desc: getString(item, ['desc', 'short_description', 'subtitle']),
    price,
    priceFormatted: formatPriceInRub(price, 'RUB'),
    weight: getNumber(item, ['weight']),
    oldPrice: oldPrice ? formatPriceStringInRub(oldPrice) : undefined,
    badgeText:
      getString(item, ['badgeText', 'badge_text', 'badge']) ||
      (isOutlet
        ? 'Склад в Милане'
        : isDiscounted
          ? 'Склад в России'
          : undefined),
    badgeColor: getString(item, ['badgeColor', 'badge_color']) === 'gray' ? 'gray' : 'green',
    discountBadge: getString(item, ['discountBadge', 'discount_badge', 'discount']),
    isNew,
    isDiscounted,
    isOutlet,
    isAvailableInMoscow:
      getBoolean(item, ['isAvailableInMoscow', 'is_available_in_moscow']) ||
      stockLocation === 'moscow',
    isLastInMilan:
      getBoolean(item, ['isLastInMilan', 'is_last_in_milan']) ||
      stockLocation === 'milan',
    category: getCategory(item, {isNew, isDiscounted, isOutlet}),
    models: getStringArray(item, [
      'models',
      'model_names',
      'ducati_models',
      'motorcycles',
      'compatible_products',
      'motorcycles_products',
      'compatibility',
      'compatible_motorcycles',
    ]),
    description: getString(item, ['description', 'full_description']),
    specs: getSpecs(item),
  };
}

function getDirectusHeaders() {
  return process.env.DIRECTUS_TOKEN
    ? {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
      }
    : undefined;
}

async function fetchDirectusJson<T>(url: URL) {
  const res = await fetch(url, {
    headers: getDirectusHeaders(),
    next: {revalidate: 60},
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as T;
}

function getRelationProductId(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object') {
    return getString(value as DirectusProduct, ['id']);
  }

  return undefined;
}

function addCompatibilityModels(product: Product, models: string[]) {
  if (models.length === 0) {
    return product;
  }

  return {
    ...product,
    models: [...new Set([...(product.models || []), ...models])],
  };
}

async function fetchProductCompatibilityFromJunction(directusUrl: string, productIds: string[]) {
  const collection = process.env.DIRECTUS_PRODUCT_MOTORCYCLES_COLLECTION || DEFAULT_PRODUCT_MOTORCYCLES_COLLECTION;
  const uniqueProductIds = [...new Set(productIds.filter(Boolean))];
  const compatibilityByProductId = new Map<string, string[]>();

  if (uniqueProductIds.length === 0) {
    return compatibilityByProductId;
  }

  const relationShapes = [
    {
      productField: 'products_id',
      fields: 'products_id,motorcycles_id.*,motorcycle_id.*',
    },
    {
      productField: 'product_id',
      fields: 'product_id,motorcycles_id.*,motorcycle_id.*',
    },
  ];

  for (const shape of relationShapes) {
    let loadedAnyRelation = false;

    for (let index = 0; index < uniqueProductIds.length; index += 100) {
      const ids = uniqueProductIds.slice(index, index + 100);
      const url = new URL(`/items/${collection}`, directusUrl);
      url.searchParams.set('fields', shape.fields);
      url.searchParams.set(`filter[${shape.productField}][_in]`, ids.join(','));
      url.searchParams.set('limit', '-1');

      const payload = await fetchDirectusJson<{data?: DirectusProduct[]}>(url);
      if (!Array.isArray(payload?.data)) {
        break;
      }

      for (const relation of payload.data) {
        const productId = getRelationProductId(relation[shape.productField]);
        const motorcycle =
          getMotorcycleLabel(relation.motorcycles_id as DirectusProduct) ||
          getMotorcycleLabel(relation.motorcycle_id as DirectusProduct);

        if (!productId || !motorcycle) {
          continue;
        }

        loadedAnyRelation = true;
        compatibilityByProductId.set(productId, [
          ...(compatibilityByProductId.get(productId) || []),
          motorcycle,
        ]);
      }
    }

    if (loadedAnyRelation) {
      break;
    }
  }

  for (const [productId, models] of compatibilityByProductId.entries()) {
    compatibilityByProductId.set(productId, [...new Set(models)]);
  }

  return compatibilityByProductId;
}

async function getProductsFromDirectusPage(page: number, pageSize: number) {
  const directusUrl = process.env.DIRECTUS_URL;
  const collection = process.env.DIRECTUS_PRODUCTS_COLLECTION || DEFAULT_PRODUCTS_COLLECTION;

  if (!directusUrl) {
    return null;
  }

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const fields = [
    '*',
    'primary_category.*',
    'categories.*',
    'compatible_products.*',
    'compatible_products.motorcycles_id.*',
    'compatible_products.motorcycle_id.*',
    'motorcycles.*',
    'motorcycles.motorcycles_id.*',
    'motorcycles.motorcycle_id.*',
    'motorcycles_products.*',
    'motorcycles_products.motorcycles_id.*',
    'motorcycles_products.motorcycle_id.*',
    'compatible_motorcycles.*',
    'compatible_motorcycles.motorcycles_id.*',
    'compatible_motorcycles.motorcycle_id.*',
  ].join(',');

  const fetchPage = async (fieldsParam: string) => {
    const url = new URL(`/items/${collection}`, directusUrl);
    url.searchParams.set('fields', fieldsParam);
    url.searchParams.set('limit', String(safePageSize));
    url.searchParams.set('offset', String((safePage - 1) * safePageSize));
    url.searchParams.set('meta', 'filter_count');

    return fetchDirectusJson<{data?: DirectusProduct[]; meta?: {filter_count?: number}}>(url);
  };

  const payload = (await fetchPage(fields)) || (await fetchPage('*,primary_category.*,categories.*'));
  if (!payload) {
    return null;
  }

  if (!Array.isArray(payload.data)) {
    return null;
  }

  const total = typeof payload.meta?.filter_count === 'number' ? payload.meta.filter_count : payload.data.length;
  const items = payload.data.map(normalizeProduct);
  const compatibilityByProductId = await fetchProductCompatibilityFromJunction(
    directusUrl,
    items.map((item) => item.id),
  );

  return {
    items: items.map((item) => addCompatibilityModels(item, compatibilityByProductId.get(item.id) || [])),
    total,
  };
}

export const fallbackProducts: Product[] = [
  {
    id: '1',
    image: DEFAULT_PRODUCT_IMAGE,
    title: 'ZDU129S00SSRE5 ZARD RACING STEEL EXHAUST SLIP-ON E5 (DVL 1260)',
    price: 220477,
    priceFormatted: '220 477 €',
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
    image: DEFAULT_PRODUCT_IMAGE,
    title: 'ZDU005SI0TTR ZARD PAIR OF COMPENSED TITANIUM SILENCERS',
    price: 231435,
    priceFormatted: '231 435 €',
    category: 'new',
    models: ['Monster 1200', 'Monster 821'],
  },
  {
    id: '3',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '71160PK ARROW PAIR OF TITANIUM SILENCERS W/ LINK',
    price: 139532,
    priceFormatted: '139 532 €',
    category: 'new',
    models: ['Panigale V4', 'Streetfighter V4'],
  },
  {
    id: '4',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '71162PK ARROW PAIR OF TITANIUM SILENCERS W/ LINK',
    price: 205808,
    priceFormatted: '205 808 €',
    category: 'new',
    models: ['Panigale V2', 'Streetfighter V2'],
  },
  {
    id: '5',
    image: DEFAULT_PRODUCT_IMAGE,
    title: 'ZDU129S00SSRE5-B ZARD RACING BLACK STEEL EXHAUST',
    price: 246546,
    priceFormatted: '246 546 €',
    category: 'new',
    models: ['Diavel 1260'],
  },
  {
    id: '6',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '96880382AB DUCATI COMFORT LOWERED SEAT (M 1200, M 821)',
    price: 27756,
    priceFormatted: '27 756 €',
    oldPrice: '30 840 €',
    badgeText: 'Склад в России',
    badgeColor: 'gray',
    discountBadge: '-10%',
    isAvailableInMoscow: true,
    category: 'discounted',
    models: ['Monster 1200', 'Monster 821'],
  },
  {
    id: '7',
    image: DEFAULT_PRODUCT_IMAGE,
    title: 'AE68151 AELLA FRAME PROTECTION (P V4 SP2)',
    price: 19176,
    priceFormatted: '19 176 €',
    oldPrice: '27 394 €',
    badgeText: 'Склад в России',
    badgeColor: 'gray',
    discountBadge: '-30%',
    isAvailableInMoscow: true,
    category: 'discounted',
    models: ['Panigale V4'],
  },
  {
    id: '8',
    image: DEFAULT_PRODUCT_IMAGE,
    title: 'DID525VX 130L DRIVE CHAIN',
    desc: 'Цепь с замком 130 звеньев',
    price: 7290,
    priceFormatted: '7 290 €',
    oldPrice: '9 720 €',
    badgeText: 'Склад в России',
    badgeColor: 'gray',
    discountBadge: '-25%',
    category: 'discounted',
    models: ['Monster 937', 'Multistrada V4', 'DesertX'],
  },
  {
    id: '9',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '97381111AA ALUMINIUM CLUTCH COVER',
    desc: 'DIAVEL 1260 /S',
    price: 15177,
    priceFormatted: '15 177 €',
    oldPrice: '20 236 €',
    badgeText: 'Склад в России',
    badgeColor: 'gray',
    discountBadge: '-25%',
    category: 'discounted',
    models: ['Diavel 1260'],
  },
  {
    id: '10',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '97181011AB DUCATI MONSTER GP COVER SET (BLK) (M 937)',
    price: 42350,
    priceFormatted: '42 350 €',
    oldPrice: '56 467 €',
    badgeText: 'Склад в Милане',
    badgeColor: 'gray',
    discountBadge: '-25%',
    desc: 'В наличии на складе в Милане. Цена указана до двери...',
    category: 'outlet',
    models: ['Monster 937'],
  },
  {
    id: '11',
    image: DEFAULT_PRODUCT_IMAGE,
    title: 'D17009400ITC TERMIGNONI TITANIUM/STEEL COMP. EXHAUST',
    price: 317682,
    priceFormatted: '317 682 €',
    badgeText: 'Склад в Милане',
    badgeColor: 'gray',
    isLastInMilan: true,
    category: 'outlet',
    models: ['Panigale V4', 'Streetfighter V4'],
  },
  {
    id: '12',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '96481563A TERMIGNONI PAIR OF TITANIUM SILENCERS (HM 950)',
    price: 164275,
    priceFormatted: '164 275 €',
    oldPrice: '182 479 €',
    badgeText: 'Склад в Милане',
    badgeColor: 'gray',
    discountBadge: '-10%',
    isLastInMilan: true,
    category: 'outlet',
    models: ['Hypermotard 950'],
  },
  {
    id: '13',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '96482052AA TERMIGNONI TITANIUM RACING EXHAUST (DSRT X)',
    price: 248755,
    priceFormatted: '248 755 €',
    badgeText: 'Склад в Милане',
    badgeColor: 'gray',
    isLastInMilan: true,
    category: 'outlet',
    models: ['DesertX'],
  },
  {
    id: '14',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '4601A711A DUCATI OIL FILTER KIT',
    price: 4890,
    priceFormatted: '4 890 €',
    badgeText: 'Без сортировки',
    badgeColor: 'gray',
    category: 'unsorted',
    models: ['Monster 937', 'Panigale V4', 'Multistrada V4'],
  },
  {
    id: '15',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '42610491A DUCATI BRAKE PAD SET FRONT',
    price: 11200,
    priceFormatted: '11 200 €',
    badgeText: 'Без сортировки',
    badgeColor: 'gray',
    category: 'unsorted',
    models: ['Monster 1200', 'Monster 821', 'Monster 937'],
  },
  {
    id: '16',
    image: DEFAULT_PRODUCT_IMAGE,
    title: '520M0591 DUCATI REAR SPROCKET 42T',
    price: 8750,
    priceFormatted: '8 750 €',
    badgeText: 'Без сортировки',
    badgeColor: 'gray',
    category: 'unsorted',
    models: ['Diavel 1260', 'Multistrada V4'],
  },
];

export const products = fallbackProducts;

function normalizeDisplayPrices(product: Product): Product {
  const oldPriceAmount = product.oldPrice ? parsePriceAmount(product.oldPrice) : undefined;

  return {
    ...product,
    price: convertPriceToRub(product.price, 'RUB'),
    priceFormatted: formatPriceInRub(product.price, 'RUB'),
    oldPrice: oldPriceAmount === undefined ? undefined : formatPriceInRub(oldPriceAmount, 'RUB'),
  };
}

export async function getProductsPage(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<ProductsPageResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  try {
    const directusPage = await getProductsFromDirectusPage(safePage, safePageSize);

    if (directusPage && directusPage.items.length > 0) {
      const totalPages = Math.max(1, Math.ceil(directusPage.total / safePageSize));
      return {
        items: directusPage.items,
        total: directusPage.total,
        page: Math.min(safePage, totalPages),
        pageSize: safePageSize,
        totalPages,
      };
    }
  } catch {
    // fall back to local demo data below
  }

  const start = (safePage - 1) * safePageSize;
  const items = fallbackProducts.slice(start, start + safePageSize).map(normalizeDisplayPrices);
  const total = fallbackProducts.length;

  return {
    items,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

export async function getProducts(): Promise<Product[]> {
  const result = await getProductsPage(1, 1000);
  return result.items;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const items = await getProducts();
  const normalizedId = normalizeLookupValue(id);

  return items.find((product) =>
    [product.id, product.sku, product.slug, getProductArticle(product)]
      .filter((value): value is string => Boolean(value))
      .some((value) => normalizeLookupValue(value) === normalizedId),
  );
}

export async function getProductsByCategory(category: Product['category']): Promise<Product[]> {
  const items = await getProducts();
  return items.filter((product) => hasProductCategory(product, category));
}

export function hasProductCategory(product: Product, category: Product['category']) {
  if (category === 'new') {
    return product.isNew || product.category === 'new';
  }

  if (category === 'discounted') {
    return product.isDiscounted || product.category === 'discounted';
  }

  if (category === 'outlet') {
    return product.isOutlet || product.category === 'outlet';
  }

  return product.category === 'unsorted' && !product.isNew && !product.isDiscounted && !product.isOutlet;
}

export function getProductArticle(product: Pick<Product, 'sku' | 'title'>) {
  return product.sku || product.title.split(' ')[0];
}

export function getProductHref(product: Pick<Product, 'id' | 'sku' | 'title'>) {
  return `/product/${encodeURIComponent(product.sku || getProductArticle(product) || product.id)}`;
}

function normalizeLookupValue(value: string) {
  return decodeURIComponent(value).trim().toLowerCase();
}
