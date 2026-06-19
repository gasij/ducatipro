import {getProductsByCategory} from '@/src/fsd/entities/product';
import {CatalogLayout} from '@/src/fsd/pages/catalog';

export default function OutletPage() {
  return (
    <CatalogLayout
      title="Аутлет в Милане"
      description="Товары со склада в Милане — цена указана до двери"
      items={getProductsByCategory('outlet')}
    />
  );
}
