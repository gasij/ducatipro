import {SearchX} from 'lucide-react';
import {getProduct, getProductArticle, getProducts} from '@/src/fsd/entities/product';
import {ProductView} from '@/src/fsd/pages/product';
import {getSiteTexts} from '@/src/fsd/shared/lib';
import {FeedbackForm} from '@/src/fsd/widgets/feedback-form';
import emptyStyles from '@/app/empty-state.module.css';

type Props = {
  params: Promise<{id: string}>;
};

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({id: getProductArticle(product)}));
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
