import {getProducts, hasProductCategory} from '@/src/fsd/entities/product';
import {getRecentlyOrderedProductIds} from '@/lib/directus';
import {HomePage} from '@/src/fsd/pages/home';
import {getSiteTexts} from '@/src/fsd/shared/lib';

const HOME_SECTION_SIZE = 20;
// Fall back to new arrivals only when there's no order history at all yet.
const MIN_RECENTLY_ORDERED = 1;

export default async function Home() {
  const [products, siteTexts, recentlyOrderedIds] = await Promise.all([
    getProducts(),
    getSiteTexts(),
    getRecentlyOrderedProductIds(HOME_SECTION_SIZE),
  ]);

  const productById = new Map(products.map((product) => [product.id, product]));
  const recentlyOrdered = recentlyOrderedIds
    .map((id) => productById.get(id))
    .filter((product): product is (typeof products)[number] => Boolean(product));

  let sectionTitle = 'Недавно заказанные';
  let sectionItems = recentlyOrdered;

  if (recentlyOrdered.length < MIN_RECENTLY_ORDERED) {
    const newArrivals = products.filter((product) => hasProductCategory(product, 'new'));
    const uncategorized = products.filter((product) => hasProductCategory(product, 'unsorted'));

    sectionTitle = 'Новинки в продаже';
    sectionItems = (newArrivals.length > 0 ? newArrivals : uncategorized).slice(0, HOME_SECTION_SIZE);
  }

  return (
    <HomePage
      newArrivals={sectionItems}
      sectionTitle={sectionTitle}
      siteTexts={siteTexts}
    />
  );
}
