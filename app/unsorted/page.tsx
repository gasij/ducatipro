import {getProductsByCategory} from '@/src/fsd/entities/product';
import {CatalogLayout} from '@/src/fsd/pages/catalog';

const PAGE_SIZE = 24;

export default async function UnsortedPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawPage = Array.isArray(params?.page) ? params?.page[0] : params?.page;
  const requestedPage = Number.parseInt(rawPage ?? '1', 10);
  const requestedPageSafe = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const allProducts = await getProductsByCategory('unsorted');
  const totalPages = Math.max(1, Math.ceil(allProducts.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPageSafe, totalPages);
  const items = allProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <CatalogLayout
      title="Товары без сортировки"
      description="Позиции, которые ещё не разнесены по категориям"
      items={items}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={allProducts.length}
      pageSize={PAGE_SIZE}
    />
  );
}
