const CBR_DAILY_RATES_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';
const RATE_CACHE_SECONDS = 3600;
const FALLBACK_EUR_TO_RUB_RATE = 100;

const PRICING_SETTINGS_COLLECTION = 'pricing_settings';
const PRICING_SETTINGS_CACHE_SECONDS = 60;
/** Used only when Directus is unreachable or the setting isn't published. */
const DEFAULT_RATE_MARKUP_PERCENT = 6;
const DEFAULT_PRODUCT_PRICE_MARKUP_PERCENT = 0;

type PricingSettings = {
  rateMarkupPercent: number;
  productPriceMarkupPercent: number;
  useManualRate: boolean;
  manualEurToRubRate: number;
};

const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  rateMarkupPercent: DEFAULT_RATE_MARKUP_PERCENT,
  productPriceMarkupPercent: DEFAULT_PRODUCT_PRICE_MARKUP_PERCENT,
  useManualRate: false,
  manualEurToRubRate: FALLBACK_EUR_TO_RUB_RATE,
};

function getFallbackRate() {
  const rawRate = process.env.NEXT_PUBLIC_EUR_TO_RUB_RATE;
  const rate = rawRate ? Number(rawRate) : FALLBACK_EUR_TO_RUB_RATE;

  return Number.isFinite(rate) && rate > 0 ? rate : FALLBACK_EUR_TO_RUB_RATE;
}

function parseEurRateFromCbrXml(xml: string) {
  // cbr.ru serves this endpoint as windows-1251; the ASCII tag/number bytes we
  // match on stay intact even when the response is decoded as UTF-8.
  const match = xml.match(
    /<CharCode>EUR<\/CharCode>\s*<Nominal>(\d+)<\/Nominal>\s*<Name>[^<]*<\/Name>\s*<Value>([\d,.]+)<\/Value>/,
  );

  if (!match) {
    return null;
  }

  const nominal = Number(match[1]);
  const value = Number(match[2].replace(',', '.'));

  return Number.isFinite(nominal) && nominal > 0 && Number.isFinite(value) ? value / nominal : null;
}

function getDirectusHeaders() {
  return process.env.DIRECTUS_TOKEN
    ? {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
      }
    : undefined;
}

/** So the admin can see, in Directus, exactly what rate the site last pulled from the CBR. */
async function recordCbrRateInDirectus(rate: number) {
  const directusUrl = process.env.DIRECTUS_URL;

  if (!directusUrl) {
    return;
  }

  try {
    const url = new URL(`/items/${PRICING_SETTINGS_COLLECTION}`, directusUrl);
    await fetch(url, {
      method: 'PATCH',
      headers: {...getDirectusHeaders(), 'Content-Type': 'application/json'},
      body: JSON.stringify({
        last_cbr_rate: rate,
        last_cbr_rate_updated_at: new Date().toISOString(),
      }),
    });
  } catch {
    // best-effort — not fetching this value shouldn't break pricing
  }
}

let cachedCbrRate: {rate: number; fetchedAt: number} | null = null;

/**
 * Raw EUR→RUB rate from the Bank of Russia, cached in-process for an hour;
 * falls back to a static rate if unreachable. Each time a fresh rate is
 * actually fetched, it's also written back to Directus (`pricing_settings.
 * last_cbr_rate`) so an admin can see what the site is currently using.
 */
async function getBaseCbrRate(): Promise<number> {
  const now = Date.now();

  if (cachedCbrRate && now - cachedCbrRate.fetchedAt < RATE_CACHE_SECONDS * 1000) {
    return cachedCbrRate.rate;
  }

  try {
    const response = await fetch(CBR_DAILY_RATES_URL);

    if (!response.ok) {
      return getFallbackRate();
    }

    const rate = parseEurRateFromCbrXml(await response.text());

    if (rate === null) {
      return getFallbackRate();
    }

    cachedCbrRate = {rate, fetchedAt: now};
    void recordCbrRateInDirectus(rate);

    return rate;
  } catch {
    return getFallbackRate();
  }
}

function toFiniteNumber(value: unknown): number | undefined {
  const num = typeof value === 'string' ? Number(value) : value;
  return typeof num === 'number' && Number.isFinite(num) ? num : undefined;
}

/**
 * All admin-configurable pricing knobs, read together from Directus
 * (`pricing_settings`, a singleton collection) and cached for a minute.
 * Falls back to sane defaults if Directus is unreachable or unconfigured —
 * this is also the fallback path if the CBR rate ever becomes unreachable,
 * since an admin can flip `use_manual_rate` on to bypass it entirely.
 */
async function getPricingSettings(): Promise<PricingSettings> {
  const directusUrl = process.env.DIRECTUS_URL;

  if (!directusUrl) {
    return DEFAULT_PRICING_SETTINGS;
  }

  try {
    const url = new URL(`/items/${PRICING_SETTINGS_COLLECTION}`, directusUrl);
    url.searchParams.set(
      'fields',
      'rate_markup_percent,product_price_markup_percent,use_manual_rate,manual_eur_to_rub_rate,status',
    );

    const res = await fetch(url, {
      headers: getDirectusHeaders(),
      next: {revalidate: PRICING_SETTINGS_CACHE_SECONDS},
    });

    if (!res.ok) {
      return DEFAULT_PRICING_SETTINGS;
    }

    const payload = (await res.json()) as {
      data?: {
        rate_markup_percent?: unknown;
        product_price_markup_percent?: unknown;
        use_manual_rate?: unknown;
        manual_eur_to_rub_rate?: unknown;
        status?: unknown;
      };
    };
    const item = payload.data;

    if (!item || item.status !== 'published') {
      return DEFAULT_PRICING_SETTINGS;
    }

    const manualRate = toFiniteNumber(item.manual_eur_to_rub_rate);

    return {
      rateMarkupPercent: toFiniteNumber(item.rate_markup_percent) ?? DEFAULT_RATE_MARKUP_PERCENT,
      productPriceMarkupPercent:
        toFiniteNumber(item.product_price_markup_percent) ?? DEFAULT_PRODUCT_PRICE_MARKUP_PERCENT,
      useManualRate: item.use_manual_rate === true,
      manualEurToRubRate: manualRate && manualRate > 0 ? manualRate : FALLBACK_EUR_TO_RUB_RATE,
    };
  } catch {
    return DEFAULT_PRICING_SETTINGS;
  }
}

/** Markup (in percent) applied on top of the CBR/manual base rate, editable in Directus (`pricing_settings`). */
export async function getRateMarkupPercent(): Promise<number> {
  const settings = await getPricingSettings();
  return settings.rateMarkupPercent;
}

/** Markup (in percent) applied to product prices themselves, editable in Directus (`pricing_settings`). */
export async function getProductPriceMarkupPercent(): Promise<number> {
  const settings = await getPricingSettings();
  return settings.productPriceMarkupPercent;
}

/**
 * Current EUR→RUB rate: either the live Bank of Russia rate or an
 * admin-entered manual rate (`use_manual_rate` in Directus — a safety net
 * for when the CBR endpoint is unreachable), plus the configured markup.
 */
export async function getCurrentEurToRubRate(): Promise<number> {
  const settings = await getPricingSettings();
  const baseRate = settings.useManualRate ? settings.manualEurToRubRate : await getBaseCbrRate();

  return baseRate * (1 + settings.rateMarkupPercent / 100);
}
