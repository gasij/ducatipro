import CatalogLayout from '../../components/CatalogLayout';
import {products} from '../../lib/products';

export default function CatalogPage() {
  return (
    <CatalogLayout
      title="Каталог"
      description="Все запчасти, тюнинг и аксессуары для мотоциклов Ducati"
      items={products}
    />
  );
}
