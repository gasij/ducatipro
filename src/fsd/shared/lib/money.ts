export type PriceCurrency = 'RUB' | 'EUR';

const DEFAULT_PRICE_CURRENCY: PriceCurrency = 'EUR';
const DEFAULT_EUR_TO_RUB_RATE = 100;

function getConfiguredPriceCurrency(): PriceCurrency {
  return process.env.NEXT_PUBLIC_PRODUCT_PRICE_CURRENCY === 'EUR'
    ? 'EUR'
    : DEFAULT_PRICE_CURRENCY;
}

function getEuroToRubRate() {
  const rawRate = process.env.NEXT_PUBLIC_EUR_TO_RUB_RATE;
  const rate = rawRate ? Number(rawRate) : DEFAULT_EUR_TO_RUB_RATE;

  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_EUR_TO_RUB_RATE;
}

export function convertPriceToRub(amount: number, currency = getConfiguredPriceCurrency()) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  if (currency === 'EUR') {
    return Math.round(safeAmount * getEuroToRubRate());
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
