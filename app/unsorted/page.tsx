import {getProductsByCategory} from '@/src/fsd/entities/product';
import {CatalogLayout} from '@/src/fsd/pages/catalog';

export default async function UnsortedPage() {
  const products = await getProductsByCategory('unsorted');

  return (
    <CatalogLayout
      title="Товары без сортировки"
      description="Позиции, которые ещё не разнесены по категориям"
      items={products}
    />
  );
}
