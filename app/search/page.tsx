import Link from 'next/link';
import {ProductCard, getProductArticle, getProductHref, getProducts, type Product} from '@/src/fsd/entities/product';
import styles from './search-page.module.css';

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getRequestedArticles(params?: Record<string, string | string[] | undefined>) {
  const rawArticles = params?.article;
  const articles = Array.isArray(rawArticles) ? rawArticles : rawArticles ? [rawArticles] : [];
  const seen = new Set<string>();

  return articles
    .map((article) => article.trim())
    .filter((article) => {
      if (!article) {
        return false;
      }

      const normalized = normalizeLookupValue(article);
      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

function normalizeLookupValue(value: string) {
  return decodeURIComponent(value).trim().toLowerCase();
}

function findProduct(products: Product[], article: string) {
  const normalizedArticle = normalizeLookupValue(article);

  return products.find((product) =>
    [product.id, product.sku, product.slug, getProductArticle(product)]
      .filter((value): value is string => Boolean(value))
      .some((value) => normalizeLookupValue(value) === normalizedArticle),
  );
}

export default async function SearchPage({searchParams}: Props) {
  const params = await searchParams;
  const requestedArticles = getRequestedArticles(params);
  const products = await getProducts();
  const matches = requestedArticles.map((article) => ({
    article,
    product: findProduct(products, article),
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
            <ProductCard key={product.id} {...product} />
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
