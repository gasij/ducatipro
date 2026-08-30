const CBR_DAILY_RATES_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';
const RATE_CACHE_SECONDS = 3600;
const FALLBACK_EUR_TO_RUB_RATE = 100;

const PRICING_SETTINGS_COLLECTION = 'pricing_settings';
const PRICING_SETTINGS_CACHE_SECONDS = 60;
/** Used only when Directus is unreachable or the setting isn't published. */
const DEFAULT_RATE_MARKUP_PERCENT = 6;

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

/** Raw EUR→RUB rate from the Bank of Russia, cached for an hour; falls back to a static rate if unreachable. */
async function getBaseCbrRate(): Promise<number> {
  try {
    const response = await fetch(CBR_DAILY_RATES_URL, {next: {revalidate: RATE_CACHE_SECONDS}});

    if (!response.ok) {
      return getFallbackRate();
    }

    const rate = parseEurRateFromCbrXml(await response.text());

    return rate ?? getFallbackRate();
  } catch {
    return getFallbackRate();
  }
}

function getDirectusHeaders() {
  return process.env.DIRECTUS_TOKEN
    ? {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
      }
    : undefined;
}

/** Markup (in percent) applied on top of the raw CBR rate, editable in Directus (`pricing_settings`). */
export async function getRateMarkupPercent(): Promise<number> {
  const directusUrl = process.env.DIRECTUS_URL;

  if (!directusUrl) {
    return DEFAULT_RATE_MARKUP_PERCENT;
  }

  try {
    const url = new URL(`/items/${PRICING_SETTINGS_COLLECTION}`, directusUrl);
    url.searchParams.set('fields', 'rate_markup_percent,status');

    const res = await fetch(url, {
      headers: getDirectusHeaders(),
      next: {revalidate: PRICING_SETTINGS_CACHE_SECONDS},
    });

    if (!res.ok) {
      return DEFAULT_RATE_MARKUP_PERCENT;
    }

    const payload = (await res.json()) as {
      data?: {rate_markup_percent?: unknown; status?: unknown};
    };
    const item = payload.data;

    if (!item || item.status !== 'published') {
      return DEFAULT_RATE_MARKUP_PERCENT;
    }

    const markup = Number(item.rate_markup_percent);

    return Number.isFinite(markup) ? markup : DEFAULT_RATE_MARKUP_PERCENT;
  } catch {
    return DEFAULT_RATE_MARKUP_PERCENT;
  }
}

/** Current EUR→RUB rate: the live Bank of Russia rate plus the markup configured in Directus. */
export async function getCurrentEurToRubRate(): Promise<number> {
  const [baseRate, markupPercent] = await Promise.all([getBaseCbrRate(), getRateMarkupPercent()]);

  return baseRate * (1 + markupPercent / 100);
}
