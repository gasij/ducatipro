const SITE_TEXTS_COLLECTION = 'site_texts';
const SITE_TEXTS_CACHE_SECONDS = 60;

export type SiteText = {
  key: string;
  value: string;
  url?: string;
};

export type SiteTextsMap = Record<string, SiteText>;

type DirectusSiteTextItem = {
  key?: unknown;
  value?: unknown;
  url?: unknown;
  status?: unknown;
};

function getDirectusHeaders() {
  return process.env.DIRECTUS_TOKEN
    ? {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
      }
    : undefined;
}

export async function getSiteTexts(): Promise<SiteTextsMap> {
  const directusUrl = process.env.DIRECTUS_URL;

  if (!directusUrl) {
    return {};
  }

  try {
    const url = new URL(`/items/${SITE_TEXTS_COLLECTION}`, directusUrl);
    url.searchParams.set('fields', 'key,value,url,status');
    url.searchParams.set('filter[status][_eq]', 'published');
    url.searchParams.set('limit', '-1');

    const res = await fetch(url, {
      headers: getDirectusHeaders(),
      next: {revalidate: SITE_TEXTS_CACHE_SECONDS},
    });

    if (!res.ok) {
      return {};
    }

    const payload = (await res.json()) as {data?: DirectusSiteTextItem[]};

    if (!Array.isArray(payload.data)) {
      return {};
    }

    const map: SiteTextsMap = {};

    for (const item of payload.data) {
      if (typeof item.key !== 'string' || !item.key) {
        continue;
      }

      const value = typeof item.value === 'string' ? item.value : undefined;
      const url_ = typeof item.url === 'string' && item.url ? item.url : undefined;

      if (value === undefined) {
        continue;
      }

      map[item.key] = {key: item.key, value, url: url_};
    }

    return map;
  } catch {
    return {};
  }
}

export function pickSiteText(texts: SiteTextsMap, key: string, fallback: string): string {
  const value = texts[key]?.value;
  return value && value.trim() ? value : fallback;
}

export function pickSiteTextUrl(texts: SiteTextsMap, key: string, fallback: string): string {
  const value = texts[key]?.url;
  return value && value.trim() ? value : fallback;
}
