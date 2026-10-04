const SITE_TEXTS_COLLECTION = 'site_texts';
const SITE_TEXTS_CACHE_SECONDS = 60;

// The only keys still managed from Directus. Every other text on the site
// lives in the code (the fallback passed to pickSiteText) and is edited there
// — a Directus row with any other key is ignored.
const DIRECTUS_MANAGED_KEYS = [
  'header.ticker_text',
  'header.ticker_text_color',
  'home.banner_image',
  'home.instagram_image_1',
  'home.instagram_image_2',
  'home.instagram_image_3',
  'home.instagram_image_4',
];

export type SiteText = {
  key: string;
  value: string;
  url?: string;
  image?: string;
};

export type SiteTextsMap = Record<string, SiteText>;

type DirectusSiteTextItem = {
  key?: unknown;
  value?: unknown;
  url?: unknown;
  image?: {id?: unknown; modified_on?: unknown} | null;
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
    url.searchParams.set('fields', 'key,value,url,image.id,image.modified_on,status');
    url.searchParams.set('filter[status][_eq]', 'published');
    url.searchParams.set('filter[key][_in]', DIRECTUS_MANAGED_KEYS.join(','));
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
      const imageId = typeof item.image?.id === 'string' && item.image.id ? item.image.id : undefined;
      // Append the file's own modified_on as a cache-busting query param —
      // Directus serves assets with a 30-day Cache-Control header, and if an
      // editor replaces a file's content in place (same file id) rather than
      // uploading a new one, the URL alone wouldn't change and Next's image
      // optimizer would keep serving the old cached bytes for weeks.
      const imageModifiedOn =
        typeof item.image?.modified_on === 'string' && item.image.modified_on
          ? item.image.modified_on
          : undefined;
      const image = imageId
        ? `${directusUrl}/assets/${imageId}${imageModifiedOn ? `?v=${encodeURIComponent(imageModifiedOn)}` : ''}`
        : undefined;

      if (value === undefined && image === undefined) {
        continue;
      }

      map[item.key] = {key: item.key, value: value ?? '', url: url_, image};
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

export function pickSiteTextImage(texts: SiteTextsMap, key: string, fallback: string): string {
  const value = texts[key]?.image;
  return value && value.trim() ? value : fallback;
}
