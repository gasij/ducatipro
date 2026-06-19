import {getProductsByCategory} from '@/src/fsd/entities/product';
import {CatalogLayout} from '@/src/fsd/pages/catalog';

export default function UnsortedPage() {
  return (
    <CatalogLayout
      title="Товары без сортировки"
      description="Позиции, которые ещё не разнесены по категориям"
      items={getProductsByCategory('unsorted')}
    />
  );
}
