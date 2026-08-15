export type PriceCurrency = 'RUB' | 'EUR';

const DEFAULT_PRICE_CURRENCY: PriceCurrency = 'EUR';
const DEFAULT_EUR_TO_RUB_RATE = 100;

function getConfiguredPriceCurrency(): PriceCurrency {
  return process.env.NEXT_PUBLIC_PRODUCT_PRICE_CURRENCY === 'EUR'
    ? 'EUR'
    : DEFAULT_PRICE_CURRENCY;
}

/** Static fallback rate, used only when the live CBR rate wasn't fetched/threaded through. */
function getStaticFallbackRate() {
  const rawRate = process.env.NEXT_PUBLIC_EUR_TO_RUB_RATE;
  const rate = rawRate ? Number(rawRate) : DEFAULT_EUR_TO_RUB_RATE;

  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_EUR_TO_RUB_RATE;
}

export function convertPriceToRub(
  amount: number,
  currency = getConfiguredPriceCurrency(),
  rate = getStaticFallbackRate(),
) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  if (currency === 'EUR') {
    return Math.round(safeAmount * rate);
  }

  return Math.round(safeAmount);
}

export function formatRubPrice(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceInRub(amount: number, currency?: PriceCurrency) {
  return formatRubPrice(convertPriceToRub(amount, currency));
}

export function parsePriceAmount(value: string) {
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : undefined;
}

export function formatPriceStringInRub(value: string) {
  const amount = parsePriceAmount(value);

  if (amount === undefined) {
    return value;
  }

  const currency: PriceCurrency = /€|\beur\b/i.test(value) ? 'EUR' : 'RUB';

  return formatPriceInRub(amount, currency);
}

export function formatEurPrice(amount: number) {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;

  return `€${new Intl.NumberFormat('ru-RU').format(safeAmount)}`;
}

export function formatPriceStringInEur(value: string) {
  const amount = parsePriceAmount(value);

  return amount === undefined ? value : formatEurPrice(amount);
}

export function formatRubHint(amountEur: number, rate = getStaticFallbackRate()) {
  return formatRubPrice(convertPriceToRub(amountEur, 'EUR', rate));
}

export function convertRubToEur(amountRub: number, rate = getStaticFallbackRate()) {
  const safeAmount = Number.isFinite(amountRub) ? amountRub : 0;

  return safeAmount / rate;
}
