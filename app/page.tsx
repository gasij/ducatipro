import {getProducts, hasProductCategory} from '@/src/fsd/entities/product';
import {HomePage} from '@/src/fsd/pages/home';

export default async function Home() {
  const products = await getProducts();
  const newArrivals = products.filter((product) => hasProductCategory(product, 'new'));
  const uncategorized = products.filter((product) => hasProductCategory(product, 'unsorted'));
  const visibleNewArrivals = newArrivals.length > 0 ? newArrivals : uncategorized;

  return (
    <HomePage
      newArrivals={visibleNewArrivals}
    />
  );
}
