import Link from 'next/link';
import {ProductCard, getProduct, getProductHref, type Product} from '@/src/fsd/entities/product';
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
  // Resolve each article directly by id/sku/slug — a bulk `getProducts()` list
  // is capped to a page of the catalog, so an article outside that page
  // would otherwise show up as "not found".
  const resolvedProducts = await Promise.all(
    requestedArticles.map((article) => getProduct(article).catch(() => undefined)),
  );
  const matches = requestedArticles.map((article, index) => ({
    article,
    product: resolvedProducts[index],
  }));
  const foundProducts = matches
    .map((match) => match.product)
    .filter((product): product is Product => Boolean(product));
  const missingArticles = matches
    .filter((match) => !match.product)
    .map((match) => match.article);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Результаты поиска</h1>
        <p className={styles.description}>
          {requestedArticles.length > 0
            ? `Проверили артикулов: ${requestedArticles.length}`
            : 'Введите артикулы в поиске в шапке сайта.'}
        </p>
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
