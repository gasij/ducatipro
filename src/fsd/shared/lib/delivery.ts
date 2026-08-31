export const ORDER_PROCESSING_FEE_EUR = 15;

const DELIVERY_WINDOW_MIN_DAYS = 28;
const DELIVERY_WINDOW_MAX_DAYS = 42;

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getExpectedDeliveryDateRange() {
  const formatter = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long'});
  const now = new Date();
  const from = formatter.format(addDays(now, DELIVERY_WINDOW_MIN_DAYS));
  const to = formatter.format(addDays(now, DELIVERY_WINDOW_MAX_DAYS));

  return `${from} - ${to}`;
}

const DELIVERY_TIERS_COLLECTION = 'delivery_tiers';
const DELIVERY_SETTINGS_COLLECTION = 'delivery_settings';
const DELIVERY_CACHE_SECONDS = 60;

export type DeliveryTier = {maxWeightKg: number; priceEur: number};

export type DeliverySettings = {orderProcessingFeeEur: number};

const DELIVERY_TIERS: DeliveryTier[] = [
  {maxWeightKg: 20, priceEur: 29},
  {maxWeightKg: 40, priceEur: 39},
  {maxWeightKg: 100, priceEur: 59},
  {maxWeightKg: 150, priceEur: 79},
  {maxWeightKg: 200, priceEur: 129},
  {maxWeightKg: 250, priceEur: 159},
  {maxWeightKg: 300, priceEur: 179},
  {maxWeightKg: 400, priceEur: 229},
  {maxWeightKg: 500, priceEur: 249},
  {maxWeightKg: 600, priceEur: 289},
];

const HEAVIEST_TIER = DELIVERY_TIERS[DELIVERY_TIERS.length - 1];

type DirectusDeliveryTierItem = {
  max_weight_kg?: unknown;
  price_eur?: unknown;
  status?: unknown;
};

type DirectusDeliverySettingsItem = {
  order_processing_fee_eur?: unknown;
  status?: unknown;
};

function getDirectusHeaders() {
  return process.env.DIRECTUS_TOKEN
    ? {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
      }
    : undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
  const num = typeof value === 'string' ? Number(value) : value;
  return typeof num === 'number' && Number.isFinite(num) ? num : undefined;
}

export async function getDeliveryTiers(): Promise<DeliveryTier[] | null> {
  const directusUrl = process.env.DIRECTUS_URL;

  if (!directusUrl) {
    return null;
  }

  try {
    const url = new URL(`/items/${DELIVERY_TIERS_COLLECTION}`, directusUrl);
    url.searchParams.set('fields', 'max_weight_kg,price_eur,status');
    url.searchParams.set('filter[status][_eq]', 'published');
    url.searchParams.set('sort', 'sort');
    url.searchParams.set('limit', '-1');

    const res = await fetch(url, {
      headers: getDirectusHeaders(),
      next: {revalidate: DELIVERY_CACHE_SECONDS},
    });

    if (!res.ok) {
      return null;
    }

    const payload = (await res.json()) as {data?: DirectusDeliveryTierItem[]};

    if (!Array.isArray(payload.data)) {
      return null;
    }

    const tiers: DeliveryTier[] = [];

    for (const item of payload.data) {
      const maxWeightKg = toFiniteNumber(item.max_weight_kg);
      const priceEur = toFiniteNumber(item.price_eur);

      if (maxWeightKg === undefined || priceEur === undefined) {
        continue;
      }

      tiers.push({maxWeightKg, priceEur});
    }

    return tiers.length > 0 ? tiers : null;
  } catch {
    return null;
  }
}

export async function getDeliverySettings(): Promise<DeliverySettings | null> {
  const directusUrl = process.env.DIRECTUS_URL;

  if (!directusUrl) {
    return null;
  }

  try {
    const url = new URL(`/items/${DELIVERY_SETTINGS_COLLECTION}`, directusUrl);
    url.searchParams.set('fields', 'order_processing_fee_eur,status');

    const res = await fetch(url, {
      headers: getDirectusHeaders(),
      next: {revalidate: DELIVERY_CACHE_SECONDS},
    });

    if (!res.ok) {
      return null;
    }

    const payload = (await res.json()) as {data?: DirectusDeliverySettingsItem};
    const item = payload.data;

    if (!item || item.status !== 'published') {
      return null;
    }

    const orderProcessingFeeEur = toFiniteNumber(item.order_processing_fee_eur);

    return orderProcessingFeeEur === undefined ? null : {orderProcessingFeeEur};
  } catch {
    return null;
  }
}

export function calculateDeliveryPriceEur(totalWeightKg: number, tiers: DeliveryTier[] = DELIVERY_TIERS) {
  const safeWeight = Number.isFinite(totalWeightKg) ? Math.max(0, totalWeightKg) : 0;
  const sourceTiers = tiers.length > 0 ? tiers : DELIVERY_TIERS;
  const tier = sourceTiers.find((tier) => safeWeight <= tier.maxWeightKg);

  return (tier || sourceTiers[sourceTiers.length - 1] || HEAVIEST_TIER).priceEur;
}
