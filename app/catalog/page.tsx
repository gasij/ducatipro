import {getProducts} from '@/src/fsd/entities/product';
import {CatalogLayout} from '@/src/fsd/pages/catalog';

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <CatalogLayout
      title="Каталог"
      description="Все запчасти, тюнинг и аксессуары для мотоциклов Ducati"
      items={products}
    />
  );
}
