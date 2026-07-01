import {getProducts, hasProductCategory} from '@/src/fsd/entities/product';
import {HomePage} from '@/src/fsd/pages/home';

export default async function Home() {
  const products = await getProducts();
  const newArrivals = products.filter((product) => hasProductCategory(product, 'new'));
  const discounted = products.filter((product) => hasProductCategory(product, 'discounted'));
  const milanOutlet = products.filter((product) => hasProductCategory(product, 'outlet'));

  return (
    <HomePage
      newArrivals={newArrivals}
      discounted={discounted}
      milanOutlet={milanOutlet}
    />
  );
}
