import {products} from '@/src/fsd/entities/product';
import {CatalogLayout} from '@/src/fsd/pages/catalog';

export default function CatalogPage() {
  return (
    <CatalogLayout
      title="Каталог"
      description="Все запчасти, тюнинг и аксессуары для мотоциклов Ducati"
      items={products}
    />
  );
}
