import {getProductsByCategory} from '@/src/fsd/entities/product';
import {HomePage} from '@/src/fsd/pages/home';

export default function Home() {
  return (
    <HomePage
      newArrivals={getProductsByCategory('new')}
      discounted={getProductsByCategory('discounted')}
      milanOutlet={getProductsByCategory('outlet')}
    />
  );
}
