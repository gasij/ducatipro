import {notFound} from 'next/navigation';
import {getProduct, getProductArticle, getProducts} from '@/src/fsd/entities/product';
import {ProductView} from '@/src/fsd/pages/product';

type Props = {
  params: Promise<{id: string}>;
};

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({id: getProductArticle(product)}));
}

export default async function ProductPage({params}: Props) {
  const {id} = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductView product={product} />;
}
