import type {MetadataRoute} from 'next';
import {getAllProductArticles} from '@/src/fsd/entities/product';

const SITE_URL = 'https://ducatiparts.ru';

// Static, non-transactional pages worth indexing. Cart/checkout/account/
// favorites/catalog-oem are deliberately left out — see app/robots.ts.
const STATIC_ROUTES: Array<{path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']}> = [
  {path: '', priority: 1, changeFrequency: 'daily'},
  {path: '/outlet', priority: 0.6, changeFrequency: 'daily'},
  {path: '/unsorted', priority: 0.6, changeFrequency: 'daily'},
  {path: '/delivery', priority: 0.4, changeFrequency: 'monthly'},
  {path: '/returns', priority: 0.4, changeFrequency: 'monthly'},
  {path: '/loyalty', priority: 0.4, changeFrequency: 'monthly'},
  {path: '/offer', priority: 0.3, changeFrequency: 'yearly'},
  {path: '/privacy', priority: 0.3, changeFrequency: 'yearly'},
];

// The catalog has 25k+ products — regenerating this on every request would
// mean ~26 paginated Directus calls each time, so it's only rebuilt hourly.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProductArticles();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({path, priority, changeFrequency}) => ({
    url: `${SITE_URL}${path}`,
    priority,
    changeFrequency,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map(({sku, updatedAt}) => ({
    url: `${SITE_URL}/product/${encodeURIComponent(sku)}`,
    lastModified: updatedAt ? new Date(updatedAt) : undefined,
    priority: 0.7,
    changeFrequency: 'weekly',
  }));

  return [...staticEntries, ...productEntries];
}
