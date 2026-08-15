const CBR_DAILY_RATES_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';
const RATE_CACHE_SECONDS = 3600;
const FALLBACK_EUR_TO_RUB_RATE = 100;

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

/** Current EUR→RUB rate from the Bank of Russia, cached for an hour; falls back to a static rate if unreachable. */
export async function getCurrentEurToRubRate(): Promise<number> {
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
