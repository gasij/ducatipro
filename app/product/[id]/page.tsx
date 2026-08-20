import {notFound} from 'next/navigation';
import {getProduct, getProductArticle, getProducts} from '@/src/fsd/entities/product';
import {ProductView} from '@/src/fsd/pages/product';
import {getSiteTexts} from '@/src/fsd/shared/lib';

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
    notFound();
  }

  return <ProductView product={product} siteTexts={siteTexts} />;
}
