import {getProducts} from '@/src/fsd/entities/product';
import {HomePage} from '@/src/fsd/pages/home';

export default async function Home() {
  const products = await getProducts();
  const newArrivals = products.filter((product) => product.category === 'new');
  const discounted = products.filter((product) => product.category === 'discounted');
  const milanOutlet = products.filter((product) => product.category === 'outlet');
  const uncategorized = products.filter((product) => product.category === 'unsorted');

  return (
    <HomePage
      newArrivals={newArrivals.length > 0 ? newArrivals : uncategorized}
      discounted={discounted}
      milanOutlet={milanOutlet}
    />
  );
}
