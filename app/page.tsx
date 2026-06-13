import HomePage from '../components/HomePage';
import {getProductsByCategory} from '../lib/products';

export default function Home() {
  return (
    <HomePage
      newArrivals={getProductsByCategory('new')}
      discounted={getProductsByCategory('discounted')}
      milanOutlet={getProductsByCategory('outlet')}
    />
  );
}
