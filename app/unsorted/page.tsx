import CatalogLayout from '../../components/CatalogLayout';
import {getProductsByCategory} from '../../lib/products';

export default function UnsortedPage() {
  return (
    <CatalogLayout
      title="Товары без сортировки"
      description="Позиции, которые ещё не разнесены по категориям"
      items={getProductsByCategory('unsorted')}
    />
  );
}
