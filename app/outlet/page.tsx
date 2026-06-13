import CatalogLayout from '../../components/CatalogLayout';
import {getProductsByCategory} from '../../lib/products';

export default function OutletPage() {
  return (
    <CatalogLayout
      title="Аутлет в Милане"
      description="Товары со склада в Милане — цена указана до двери"
      items={getProductsByCategory('outlet')}
    />
  );
}
