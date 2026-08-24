import {getProducts, hasProductCategory} from '@/src/fsd/entities/product';
import {HomePage} from '@/src/fsd/pages/home';
import {getSiteTexts} from '@/src/fsd/shared/lib';

const HOME_SECTION_SIZE = 20;

export default async function Home() {
  const [products, siteTexts] = await Promise.all([getProducts(), getSiteTexts()]);
  const newArrivals = products.filter((product) => hasProductCategory(product, 'new'));
  const uncategorized = products.filter((product) => hasProductCategory(product, 'unsorted'));
  const visibleNewArrivals = (newArrivals.length > 0 ? newArrivals : uncategorized).slice(0, HOME_SECTION_SIZE);

  return (
    <HomePage
      newArrivals={visibleNewArrivals}
      siteTexts={siteTexts}
    />
  );
}
