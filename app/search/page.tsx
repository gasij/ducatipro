import Link from 'next/link';
import {redirect} from 'next/navigation';
import {
  ProductCard,
  getProductArticle,
  getProductHref,
  searchProductsByArticle,
  type Product,
} from '@/src/fsd/entities/product';
import styles from './search-page.module.css';

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getRequestedArticles(params?: Record<string, string | string[] | undefined>) {
  const rawArticles = params?.article;
  const articles = Array.isArray(rawArticles) ? rawArticles : rawArticles ? [rawArticles] : [];
  const seen = new Set<string>();

  return articles
    .map((article) => decodeURIComponent(article).trim())
    .filter((article) => {
      if (!article) {
        return false;
      }

      const normalized = article.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

export default async function SearchPage({searchParams}: Props) {
  const params = await searchParams;
  const requestedArticles = getRequestedArticles(params);
  // Partial match: 59810381 finds 59810381A, 59810381AA, 59810381F and so on.
  // Each article is searched in Directus directly — a bulk `getProducts()` list
  // is capped to a page of the catalog.
  const results = await Promise.all(
    requestedArticles.map((article) =>
      searchProductsByArticle(article).catch(() => ({items: [] as Product[], total: 0})),
    ),
  );

  // A single article that resolves to exactly one product with that very article —
  // open the product page right away, as the header search did before.
  if (requestedArticles.length === 1 && results[0].total === 1) {
    const [product] = results[0].items;
    const article = requestedArticles[0].replace(/\s+/g, '').toLowerCase();
    const isExactMatch = [product.sku, product.oldSku, getProductArticle(product)].some(
      (value) => value?.toLowerCase() === article,
    );
    if (isExactMatch) {
      redirect(getProductHref(product));
    }
  }

  const seenProductIds = new Set<string>();
  const foundProducts = results
    .flatMap((result) => result.items)
    .filter((product) => {
      if (seenProductIds.has(product.id)) {
        return false;
      }
      seenProductIds.add(product.id);
      return true;
    });
  const missingArticles = requestedArticles.filter((_, index) => results[index].total === 0);
  const truncatedArticles = requestedArticles
    .map((article, index) => ({article, shown: results[index].items.length, total: results[index].total}))
    .filter((result) => result.total > result.shown);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Результаты поиска</h1>
        <p className={styles.description}>
          {requestedArticles.length > 0
            ? `Проверили артикулов: ${requestedArticles.length}, найдено товаров: ${foundProducts.length}`
            : 'Введите артикулы в поиске в шапке сайта.'}
        </p>
        {truncatedArticles.map(({article, shown, total}) => (
          <p key={article} className={styles.description}>
            По «{article}» показаны первые {shown} из {total} — уточните артикул.
          </p>
        ))}
      </div>

      {foundProducts.length > 0 ? (
        <div className={styles.grid}>
          {foundProducts.map((product) => (
            <ProductCard key={product.id} {...product} showAddToCart />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>По этим артикулам товары не найдены.</p>
          <Link href="/" className={styles.homeLink}>
            На главную
          </Link>
        </div>
      )}

      {missingArticles.length > 0 && (
        <section className={styles.missing}>
          <h2 className={styles.missingTitle}>Не найдены</h2>
          <div className={styles.missingList}>
            {missingArticles.map((article) => (
              <span key={article} className={styles.missingItem}>
                {article}
              </span>
            ))}
          </div>
        </section>
      )}

      {foundProducts.length === 1 && (
        <Link href={getProductHref(foundProducts[0])} className={styles.productLink}>
          Открыть найденный товар
        </Link>
      )}
    </main>
  );
}
