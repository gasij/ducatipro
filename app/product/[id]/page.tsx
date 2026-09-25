import type {Metadata} from 'next';
import {SearchX} from 'lucide-react';
import {getProduct, getProductArticle, getProducts} from '@/src/fsd/entities/product';
import {ProductView} from '@/src/fsd/pages/product';
import {formatEurPrice, getSiteTexts} from '@/src/fsd/shared/lib';
import {FeedbackForm} from '@/src/fsd/widgets/feedback-form';
import emptyStyles from '@/app/empty-state.module.css';

type Props = {
  params: Promise<{id: string}>;
};

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({id: getProductArticle(product)}));
}

const SEO_BRAND_SUFFIX = 'Оригинальные запчасти Дукати (Ducati) с доставкой из Италии';

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {id} = await params;
  const product = await getProduct(id);

  if (!product) {
    return {title: 'Товар не найден'};
  }

  const article = getProductArticle(product);
  const oldSkuSuffix = product.oldSku ? ` (${product.oldSku})` : '';
  const titleWithArticle =
    article && !product.title.toUpperCase().includes(article.toUpperCase())
      ? `${article}${oldSkuSuffix} ${product.title}`
      : product.title;
  // Outlet stock is physically on hand (Milan warehouse) — "купить" fits;
  // everything else is made to order from Italy, so "заказать" is accurate.
  const actionVerb = product.isOutlet ? 'купить' : 'заказать';
  const title = `${titleWithArticle} - ${actionVerb} за ${formatEurPrice(product.price)} | ${SEO_BRAND_SUFFIX}`;
  const description =
    product.description ||
    `${actionVerb === 'купить' ? 'Купить' : 'Заказать'} ${titleWithArticle} — оригинальная запчасть Ducati, цена ${formatEurPrice(product.price)}. Доставка по России и из Италии.`;

  return {title: {absolute: title}, description};
}

export default async function ProductPage({params}: Props) {
  const {id} = await params;
  const [product, siteTexts] = await Promise.all([getProduct(id), getSiteTexts()]);

  if (!product) {
    return (
      <div>
        <div className={emptyStyles.page}>
          <SearchX className={emptyStyles.icon} />
          <h1 className={emptyStyles.title}>Товар «{id}» не найден</h1>
          <p className={emptyStyles.description}>
            Проверьте правильность артикула или напишите нам — поможем найти нужную деталь.
          </p>
        </div>
        <FeedbackForm siteTexts={siteTexts} />
      </div>
    );
  }

  return <ProductView product={product} siteTexts={siteTexts} />;
}
