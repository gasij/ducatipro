import {getProductsByCategory} from '@/src/fsd/entities/product';
import {CatalogLayout} from '@/src/fsd/pages/catalog';

export default async function OutletPage() {
  const products = await getProductsByCategory('outlet');

  return (
    <CatalogLayout
      title="Аутлет в Милане"
      description="Товары со склада в Милане — цена указана до двери"
      items={products}
    />
  );
}
