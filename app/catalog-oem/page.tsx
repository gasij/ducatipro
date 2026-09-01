import {getProductsPage} from '@/src/fsd/entities/product';
import {CatalogLayout} from '@/src/fsd/pages/catalog';
import {getSiteTexts, pickSiteText} from '@/src/fsd/shared/lib';

const PAGE_SIZE = 10;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawPage = Array.isArray(params?.page) ? params?.page[0] : params?.page;
  const requestedPage = Number.parseInt(rawPage ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [{items, total, pageSize, totalPages, page: currentPage}, siteTexts] = await Promise.all([
    getProductsPage(page, PAGE_SIZE),
    getSiteTexts(),
  ]);

  return (
    <CatalogLayout
      title={pickSiteText(siteTexts, 'catalog.title', 'Каталог OEM')}
      description={pickSiteText(
        siteTexts,
        'catalog.description',
        'Все запчасти, тюнинг и аксессуары для мотоциклов Ducati',
      )}
      items={items}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={total}
      pageSize={pageSize}
    />
  );
}
