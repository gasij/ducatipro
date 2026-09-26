import type {MetadataRoute} from 'next';

const SITE_URL = 'https://ducatiparts.ru';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/cart', '/checkout', '/account', '/favorites', '/catalog-oem'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
